/**
 * 搜索协调器
 * Search Coordinator for managing both TitleSearchEngine and ContentSearchEngine
 * Maintains backward compatibility with the original SearchEngine interface
 */

import { SearchIndex, SearchableArticle, SearchResult, ParsedArticle } from '../types';
import { TitleSearchEngine } from './TitleSearchEngine';
import { ContentSearchEngine } from './ContentSearchEngine';

export class SearchCoordinator {
  private titleSearchEngine: TitleSearchEngine;
  private contentSearchEngine: ContentSearchEngine;
  private articleMap = new Map<string, ParsedArticle>();

  constructor() {
    this.titleSearchEngine = new TitleSearchEngine();
    this.contentSearchEngine = new ContentSearchEngine();
  }

  /**
   * 构建搜索索引
   * Build search index from articles using both title and content search engines
   */
  buildIndex(articles: ParsedArticle[]): SearchIndex {
    // Clear the map and rebuild it
    this.articleMap.clear();

    // Build both title and content indexes
    const titleIndex = this.titleSearchEngine.buildIndex(articles);
    const contentIndex = this.contentSearchEngine.buildIndex(articles);

    // Store articles for access during search
    const searchableArticles: SearchableArticle[] = articles
      .filter(article => !article.metadata.draft)
      .map(article => {
        const id = this.generateId(article.filePath);
        this.articleMap.set(id, article);

        return {
          id,
          title: article.metadata.title,
          content: this.extractSearchableContent(article.content),
          tags: article.metadata.tags,
          slug: article.metadata.slug || this.createSlug(article.metadata.title)
        };
      });

    // Combine the title and content indexes into a single index
    const combinedIndex = new Map<string, Array<{articleIndex: number, weight: number}>>();

    // Add title index entries
    titleIndex.forEach((titleEntries, word) => {
      if (!combinedIndex.has(word)) {
        combinedIndex.set(word, []);
      }
      const wordData = combinedIndex.get(word)!;
      titleEntries.forEach(entry => {
        // Check if this articleIndex already exists for this word, if so update the weight
        const existing = wordData.find(data => data.articleIndex === entry.articleIndex);
        if (existing) {
          existing.weight += entry.weight; // Combined weight if title and content match
        } else {
          wordData.push({...entry}); // Copy the entry to avoid reference issues
        }
      });
    });

    // Add content index entries
    contentIndex.forEach((contentEntries, word) => {
      if (!combinedIndex.has(word)) {
        combinedIndex.set(word, []);
      }
      const wordData = combinedIndex.get(word)!;
      contentEntries.forEach(entry => {
        // Check if this articleIndex already exists for this word, if so update the weight
        const existing = wordData.find(data => data.articleIndex === entry.articleIndex);
        if (existing) {
          existing.weight += entry.weight; // Combined weight if title and content match
        } else {
          wordData.push({...entry}); // Copy the entry to avoid reference issues
        }
      });
    });

    return {
      articles: searchableArticles,
      index: combinedIndex
    };
  }

  /**
   * 搜索文章
   * Search articles by query using both title and content search engines
   */
  search(query: string, searchIndex: SearchIndex): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    // Perform search using the combined index
    const queryWords = this.extractWords(query);
    const articleScores = new Map<number, { score: number; matchedWords: string[]; matchLocations: { inTitle: boolean, inContent: boolean, inTags: boolean } }>();

    // Calculate relevance score for each article
    queryWords.forEach(word => {
      const articleWeightData = searchIndex.index.get(word) || [];
      articleWeightData.forEach(data => {
        const current = articleScores.get(data.articleIndex) || {
          score: 0,
          matchedWords: [],
          matchLocations: { inTitle: false, inContent: false, inTags: false }
        };
        current.score += data.weight; // Use weight to calculate score
        if (!current.matchedWords.includes(word)) {
          current.matchedWords.push(word);
        }

        // Determine where the match occurred based on weight
        if (data.weight === 3) {
          current.matchLocations.inTitle = true;
        } else if (data.weight === 2) {
          current.matchLocations.inTags = true;
        } else if (data.weight === 1) {
          current.matchLocations.inContent = true;
        } else if (data.weight > 3) {
          // If weight is greater than 3, it's a combination match (title + content or title + tag or all three)
          if (data.weight >= 3) current.matchLocations.inTitle = true;
          if (data.weight >= 2) current.matchLocations.inTags = true;
          if (data.weight >= 1) current.matchLocations.inContent = true;
        }

        articleScores.set(data.articleIndex, current);
      });
    });

    // Convert to search results and sort
    const results: SearchResult[] = [];
    articleScores.forEach((scoreData, articleIndex) => {
      const searchableArticle = searchIndex.articles[articleIndex];
      if (searchableArticle) {
        // Get the original article data from the map
        const originalArticle = this.articleMap.get(searchableArticle.id);
        if (originalArticle) {
          results.push({
            article: originalArticle,
            score: scoreData.score,
            highlights: this.generateHighlights(searchableArticle, scoreData.matchedWords),
            matchLocations: scoreData.matchLocations
          });
        }
      }
    });

    // Sort by score in descending order
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * 生成搜索数据JSON
   * Generate search data for client-side search
   */
  generateSearchData(searchIndex: SearchIndex): string {
    const searchData = {
      articles: searchIndex.articles.map(article => {
        const originalArticle = this.articleMap.get(article.id);
        return {
          id: article.id,
          title: article.title,
          paragraphs: originalArticle ? this.splitIntoParagraphs(originalArticle.content) : [],
          tags: article.tags,
          slug: article.slug
        };
      })
    };

    return JSON.stringify(searchData, null, 2);
  }

  /**
   * 生成搜索结果高亮
   * Generate highlights for search results
   */
  private generateHighlights(article: SearchableArticle, queryWords: string[]): string[] {
    const highlights: string[] = [];

    queryWords.forEach(word => {
      // Look for matches in both title and content
      const titleMatches = this.findMatchesInText(article.title, word, 30);
      const contentMatches = this.findMatchesInText(article.content, word, 50);

      // Add title matches (higher priority)
      titleMatches.forEach(match => {
        highlights.push(`<strong>[TITLE]</strong> ${match}`);
      });

      // Add content matches
      contentMatches.forEach(match => {
        highlights.push(`<em>[CONTENT]</em> ${match}`);
      });
    });

    // Deduplicate and limit quantity
    return [...new Set(highlights)].slice(0, 3);
  }

  /**
   * 在文本中查找匹配项
   * Find matches in text and return highlighted snippets
   */
  private findMatchesInText(text: string, word: string, contextLength: number): string[] {
    const matches: string[] = [];

    // Process highlighting for both Chinese and English separately
    const chineseRegex = new RegExp(`(.{0,${contextLength}})(${this.escapeRegex(word)})(.{0,${contextLength}})`, 'gi');
    const englishRegex = new RegExp(`(.{0,${contextLength}})\\b(${this.escapeRegex(word)})\\b(.{0,${contextLength}})`, 'gi');

    let matchResults = text.match(chineseRegex);
    if (!matchResults) {
      matchResults = text.match(englishRegex);
    }

    if (matchResults) {
      // Take first few matches and add highlight markers
      const limitedMatches = matchResults.slice(0, 2);
      limitedMatches.forEach(match => {
        matches.push(match.replace(
          new RegExp(`(${this.escapeRegex(word)})`, 'gi'),
          '<mark>$1</mark>'
        ));
      });
    }

    return matches;
  }

  /**
   * 转义正则表达式特殊字符
   * Escape regex special characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 提取可搜索的内容
   * Extract searchable content from markdown
   */
  private extractSearchableContent(content: string): string {
    return content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[#*_~`]/g, '') // Remove markdown symbols
      .replace(/\s+/g, ' ') // Combine spaces
      .trim();
  }

  /**
   * 将内容拆分为段落数组
   * Split content into paragraphs for paragraph-level search
   */
  private splitIntoParagraphs(content: string): string[] {
    return content
      .split(/\n\n+/)
      .map(p => p
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/[#*_~`]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      )
      .filter(p => p.length >= 10);
  }

  /**
   * 提取搜索词
   * Extract words for indexing
   */
  private extractWords(text: string): string[] {
    const words: string[] = [];

    // Extract Chinese characters (single character as word)
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    words.push(...chineseChars);

    // Extract English words and numbers
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, ' ') // Replace Chinese characters with space
      .toLowerCase()
      .match(/[a-z0-9]+/g) || [];
    words.push(...englishWords);

    // Deduplicate and filter short words and common stop words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);

    return [...new Set(words)]
      .filter(word => word.length > 1 && !stopWords.has(word.toLowerCase()));
  }

  /**
   * 生成文章ID
   * Generate article ID
   */
  private generateId(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  }

  /**
   * 创建URL友好的slug
   * Create URL-friendly slug
   */
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}