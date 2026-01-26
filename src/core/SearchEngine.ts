/**
 * 搜索引擎
 * Search Engine for building search index and providing search functionality
 */

import { SearchIndex, SearchableArticle, SearchResult, ParsedArticle } from '../types';

export class SearchEngine {
  // 存储原始文章数据的映射，用于搜索结果
  private articleMap = new Map<string, ParsedArticle>();

  /**
   * 构建搜索索引
   * Build search index from articles
   */
  buildIndex(articles: ParsedArticle[]): SearchIndex {
    // 清空之前的映射
    this.articleMap.clear();

    const searchableArticles: SearchableArticle[] = articles
      .filter(article => !article.metadata.draft)
      .map(article => {
        const id = this.generateId(article.filePath);
        const slug = article.metadata.slug || this.createSlug(article.metadata.title);
        
        // 存储原始文章数据
        this.articleMap.set(id, article);
        
        return {
          id,
          title: article.metadata.title,
          content: this.extractSearchableContent(article.content),
          tags: article.metadata.tags,
          slug
        };
      });

    const index = new Map<string, number[]>();

    // 为每篇文章建立索引
    searchableArticles.forEach((article, articleIndex) => {
      const words = this.extractWords(article.title + ' ' + article.content + ' ' + article.tags.join(' '));
      
      words.forEach(word => {
        if (!index.has(word)) {
          index.set(word, []);
        }
        const articleIndices = index.get(word)!;
        if (!articleIndices.includes(articleIndex)) {
          articleIndices.push(articleIndex);
        }
      });
    });

    return {
      articles: searchableArticles,
      index
    };
  }

  /**
   * 搜索文章
   * Search articles by query
   */
  search(query: string, searchIndex: SearchIndex): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const queryWords = this.extractWords(query);
    const articleScores = new Map<number, { score: number; matchedWords: string[] }>();

    // 计算每篇文章的相关性分数
    queryWords.forEach(word => {
      const articleIndices = searchIndex.index.get(word) || [];
      articleIndices.forEach(articleIndex => {
        const current = articleScores.get(articleIndex) || { score: 0, matchedWords: [] };
        current.score += 1;
        if (!current.matchedWords.includes(word)) {
          current.matchedWords.push(word);
        }
        articleScores.set(articleIndex, current);
      });
    });

    // 转换为搜索结果并排序
    const results: SearchResult[] = [];
    articleScores.forEach((scoreData, articleIndex) => {
      const searchableArticle = searchIndex.articles[articleIndex];
      if (searchableArticle) {
        // 从映射中获取原始文章数据
        const originalArticle = this.articleMap.get(searchableArticle.id);
        if (originalArticle) {
          results.push({
            article: originalArticle,
            score: scoreData.score,
            highlights: this.generateHighlights(searchableArticle, scoreData.matchedWords)
          });
        }
      }
    });

    // 按分数降序排序
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * 生成搜索数据JSON
   * Generate search data for client-side search
   */
  generateSearchData(searchIndex: SearchIndex): string {
    const searchData = {
      articles: searchIndex.articles.map(article => ({
        id: article.id,
        title: article.title,
        content: article.content.substring(0, 200), // 只保留前200字符
        tags: article.tags,
        slug: article.slug
      }))
    };

    return JSON.stringify(searchData, null, 2);
  }

  /**
   * 提取可搜索的内容
   * Extract searchable content from markdown
   */
  private extractSearchableContent(content: string): string {
    return content
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/`[^`]+`/g, '') // 移除行内代码
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
      .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/[#*_~`]/g, '') // 移除markdown符号
      .replace(/\s+/g, ' ') // 合并空格
      .trim();
  }

  /**
   * 提取搜索词
   * Extract words for indexing
   */
  private extractWords(text: string): string[] {
    const words: string[] = [];
    
    // 提取中文字符（单个字符作为词）
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    words.push(...chineseChars);

    // 提取英文单词和数字
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, ' ') // 将中文字符替换为空格
      .toLowerCase()
      .match(/[a-z0-9]+/g) || [];
    words.push(...englishWords);

    // 去重并过滤短词和常见停用词
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    return [...new Set(words)]
      .filter(word => word.length > 1 && !stopWords.has(word.toLowerCase()));
  }

  /**
   * 生成搜索结果高亮
   * Generate highlights for search results
   */
  private generateHighlights(article: SearchableArticle, queryWords: string[]): string[] {
    const highlights: string[] = [];
    const content = article.title + ' ' + article.content;
    
    queryWords.forEach(word => {
      // 为中文和英文分别处理高亮
      const chineseRegex = new RegExp(`(.{0,20})(${this.escapeRegex(word)})(.{0,20})`, 'gi');
      const englishRegex = new RegExp(`(.{0,30})\\b(${this.escapeRegex(word)})\\b(.{0,30})`, 'gi');
      
      let matches = content.match(chineseRegex);
      if (!matches) {
        matches = content.match(englishRegex);
      }
      
      if (matches) {
        // 取前2个匹配项，并添加高亮标记
        const highlightedMatches = matches.slice(0, 2).map(match => {
          return match.replace(
            new RegExp(`(${this.escapeRegex(word)})`, 'gi'),
            '<mark>$1</mark>'
          );
        });
        highlights.push(...highlightedMatches);
      }
    });

    // 去重并限制数量
    return [...new Set(highlights)].slice(0, 3);
  }

  /**
   * 转义正则表达式特殊字符
   * Escape regex special characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  /**
   * 计算字数
   * Calculate word count
   */
  private calculateWordCount(content: string): number {
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = content.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(word => word.length > 0).length;
    return chineseChars + englishWords;
  }
}