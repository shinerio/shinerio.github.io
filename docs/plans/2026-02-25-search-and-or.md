# Search AND/OR Syntax Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add paragraph-level AND/OR search syntax to the blog search page, where space-separated terms default to AND (all terms must appear in the same paragraph).

**Architecture:** Three-file change — server-side `generateSearchData()` outputs `paragraphs[]` instead of truncated `content` string; client-side `performSearch()` gains a `parseQuery()` helper and paragraph-level AND/OR matching; `search.html` placeholder updated.

**Tech Stack:** TypeScript (server-side data generation), vanilla JS (client-side search in `layout.html`), Jest/ts-jest (tests)

---

### Task 1: Add `splitIntoParagraphs()` helper and update `generateSearchData()`

**Files:**
- Modify: `src/core/SearchCoordinator.ts`

**Step 1: Add the private helper method**

In `src/core/SearchCoordinator.ts`, add a new private method after `extractSearchableContent()` (around line 256):

```typescript
/**
 * 将内容拆分为段落数组
 * Split content into paragraphs for paragraph-level search
 */
private splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length >= 10);
}
```

**Step 2: Update `generateSearchData()` to output `paragraphs` instead of `content`**

Replace the existing `generateSearchData()` method body (lines 163-175):

Old:
```typescript
generateSearchData(searchIndex: SearchIndex): string {
  const searchData = {
    articles: searchIndex.articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content.substring(0, 200), // Only first 200 characters
      tags: article.tags,
      slug: article.slug
    }))
  };

  return JSON.stringify(searchData, null, 2);
}
```

New:
```typescript
generateSearchData(searchIndex: SearchIndex): string {
  const searchData = {
    articles: searchIndex.articles.map(article => ({
      id: article.id,
      title: article.title,
      paragraphs: this.splitIntoParagraphs(article.content),
      tags: article.tags,
      slug: article.slug
    }))
  };

  return JSON.stringify(searchData, null, 2);
}
```

**Step 3: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add src/core/SearchCoordinator.ts
git commit -m "feat: store article paragraphs in search data instead of truncated content"
```

---

### Task 2: Update the test for `generateSearchData()`

**Files:**
- Modify: `test/unit/SearchCoordinator.test.ts`

**Step 1: Find the existing `generateSearchData` test**

Look at the test block starting around line 53 in `test/unit/SearchCoordinator.test.ts`:

```typescript
// Should be able to generate search data like the original
const searchData = searchCoordinator.generateSearchData(searchIndex);
expect(typeof searchData).toBe('string');
const parsedData = JSON.parse(searchData);
expect(parsedData.articles).toBeTruthy();
```

**Step 2: Extend the test to verify `paragraphs` field**

Replace the block above with:

```typescript
// Should be able to generate search data like the original
const searchData = searchCoordinator.generateSearchData(searchIndex);
expect(typeof searchData).toBe('string');
const parsedData = JSON.parse(searchData);
expect(parsedData.articles).toBeTruthy();
// Verify new paragraphs format
if (parsedData.articles.length > 0) {
  expect(Array.isArray(parsedData.articles[0].paragraphs)).toBe(true);
  expect(parsedData.articles[0].content).toBeUndefined();
}
```

**Step 3: Add a dedicated paragraph splitting test**

After the existing test blocks in `SearchCoordinator.test.ts`, add:

```typescript
it('should split article content into paragraphs in search data', () => {
  const articles: ParsedArticle[] = [
    {
      metadata: {
        title: 'Paragraph Test',
        date: new Date('2023-01-01'),
        tags: [],
        draft: false,
        slug: 'paragraph-test'
      },
      content: 'First paragraph with enough text here.\n\nSecond paragraph also long enough.\n\nShort.',
      filePath: '/vault/paragraph-test.md'
    }
  ];

  const searchIndex = searchCoordinator.buildIndex(articles);
  const searchData = searchCoordinator.generateSearchData(searchIndex);
  const parsed = JSON.parse(searchData);

  expect(parsed.articles).toHaveLength(1);
  const article = parsed.articles[0];
  expect(Array.isArray(article.paragraphs)).toBe(true);
  // "Short." is less than 10 chars and should be filtered out
  expect(article.paragraphs).toContain('First paragraph with enough text here.');
  expect(article.paragraphs).toContain('Second paragraph also long enough.');
  expect(article.paragraphs).not.toContain('Short.');
});
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern="SearchCoordinator"
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add test/unit/SearchCoordinator.test.ts
git commit -m "test: update SearchCoordinator tests for paragraphs search data format"
```

---

### Task 3: Update client-side search in `layout.html`

**Files:**
- Modify: `templates/layout.html`

The entire search logic lives in the `<script>` block at the bottom of `layout.html` (lines ~257–503). The changes are inside `performSearch()` and surrounding helpers.

**Step 1: Add `parseQuery()` helper**

Insert this new function right before `function performSearch(query) {` (around line 304):

```javascript
// Parse query string into terms and operator (AND/OR)
function parseQuery(query) {
  const tokens = query.trim().split(/\s+/);
  const terms = [];
  let operator = 'AND'; // default
  let operatorFound = false;

  tokens.forEach(function(token) {
    const upper = token.toUpperCase();
    if ((upper === 'AND' || upper === 'OR') && !operatorFound) {
      operator = upper;
      operatorFound = true;
    } else if (token.length > 0) {
      terms.push(token.toLowerCase());
    }
  });

  return { terms: terms, operator: operator };
}

// Highlight matched terms in a text snippet
function highlightTerms(text, terms) {
  let result = text;
  terms.forEach(function(term) {
    result = result.replace(
      new RegExp('(' + escapeRegExp(term) + ')', 'gi'),
      '<mark>$1</mark>'
    );
  });
  return result;
}
```

**Step 2: Replace `performSearch()` entirely**

Replace the existing `function performSearch(query) { ... }` block (lines ~304–428) with:

```javascript
// Perform search
function performSearch(query) {
  if (!searchData || !query.trim()) {
    searchResults.innerHTML = '';
    searchSuggestions.innerHTML = '';
    return;
  }

  const parsed = parseQuery(query);
  const terms = parsed.terms;
  const operator = parsed.operator;
  const searchType = getSelectedSearchType();

  if (terms.length === 0) {
    searchResults.innerHTML = '';
    return;
  }

  const results = [];

  searchData.articles.forEach(function(article) {
    let score = 0;
    let snippet = '';

    const lowerTitle = article.title.toLowerCase();
    const lowerTags = (article.tags || []).join(' ').toLowerCase();
    const paragraphs = article.paragraphs || [];

    // --- Title scoring ---
    if (searchType !== 'content') {
      if (operator === 'AND') {
        // All terms must appear in title
        if (terms.every(function(t) { return lowerTitle.includes(t); })) {
          score += 10 * terms.length;
        }
      } else {
        // OR: any term in title
        terms.forEach(function(term) {
          if (lowerTitle.includes(term)) score += 10;
        });
      }
    }

    // --- Tag scoring (only for 'all' search type) ---
    if (searchType === 'all') {
      if (operator === 'AND') {
        if (terms.every(function(t) { return lowerTags.includes(t); })) {
          score += 5 * terms.length;
        }
      } else {
        terms.forEach(function(term) {
          if (lowerTags.includes(term)) score += 5;
        });
      }
    }

    // --- Paragraph scoring ---
    if (searchType !== 'title') {
      if (operator === 'AND') {
        // Find paragraphs containing ALL terms
        const matchingParas = paragraphs.filter(function(para) {
          const lowerPara = para.toLowerCase();
          return terms.every(function(t) { return lowerPara.includes(t); });
        });

        if (matchingParas.length > 0) {
          score += matchingParas.length * terms.length;
          snippet = highlightTerms(matchingParas[0], terms);
        }
      } else {
        // OR: any term in any paragraph
        let orScore = 0;
        let firstMatchPara = '';

        paragraphs.forEach(function(para) {
          const lowerPara = para.toLowerCase();
          const matchCount = terms.filter(function(t) { return lowerPara.includes(t); }).length;
          if (matchCount > 0) {
            orScore += matchCount;
            if (!firstMatchPara) firstMatchPara = para;
          }
        });

        if (firstMatchPara) {
          score += orScore;
          snippet = highlightTerms(firstMatchPara, terms);
        }
      }
    }

    if (score > 0) {
      results.push({
        article: article,
        score: score,
        snippet: snippet
      });
    }
  });

  // Sort results by score
  results.sort(function(a, b) { return b.score - a.score; });

  // Display results
  displaySearchResults(results, operator);
}
```

**Step 3: Update `displaySearchResults()` to accept `operator` and show AND no-results hint**

Replace the existing `function displaySearchResults(results) { ... }` block (lines ~431–450) with:

```javascript
// Display search results
function displaySearchResults(results, operator) {
  if (results.length === 0) {
    if (operator === 'AND') {
      searchResults.innerHTML = '<p class="no-results">未找到所有关键词同时出现在同一段落的文章，试试 OR 语法</p>';
    } else {
      searchResults.innerHTML = '<p class="no-results">未找到匹配的文章</p>';
    }
    return;
  }

  const resultsHTML = results.map(function(result) {
    return '<div class="search-result-item">' +
      '<h3 class="search-result-title">' +
      '<a href="./' + result.article.slug + '.html">' +
      highlightQueryTerms(result.article.title, document.querySelector('#search-input').value) +
      '</a></h3>' +
      '<div class="search-result-meta">' +
      (result.article.tags || []).map(function(tag) { return '<span class="tag">#' + tag + '</span>'; }).join('') +
      '</div>' +
      '<p class="search-result-excerpt">' + result.snippet + '</p>' +
      '</div>';
  }).join('');

  searchResults.innerHTML = resultsHTML;
}
```

**Step 4: Update the call sites for `displaySearchResults`**

The old `displaySearchResults(results)` call inside `performSearch` is already handled since we rewrote that function. Verify there are no other call sites.

**Step 5: Verify the build and manual test**

```bash
npm run build
```

Expected: Build succeeds.

**Step 6: Commit**

```bash
git add templates/layout.html
git commit -m "feat: add AND/OR paragraph-level search syntax (default AND)"
```

---

### Task 4: Update `search.html` placeholder

**Files:**
- Modify: `templates/search.html`

**Step 1: Update the input placeholder**

In `templates/search.html` line 5, change:

```html
<input type="text" id="search-input" class="search-input" placeholder="Search articles..." autocomplete="off">
```

To:

```html
<input type="text" id="search-input" class="search-input" placeholder="Search articles... (多词默认AND，支持 OR 语法)" autocomplete="off">
```

**Step 2: Commit**

```bash
git add templates/search.html
git commit -m "feat: update search placeholder to show AND/OR syntax hint"
```

---

### Task 5: End-to-end verification

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass.

**Step 2: Regenerate site and check search-data.json format**

```bash
npm run build && node dist/cli.js generate
```

Open `dist/assets/js/search-data.json` and verify:
- Each article has `paragraphs: string[]`
- No `content` field present

**Step 3: Open search page in browser**

Open `dist/search.html` in a browser and test:
- `Python 机器学习` → AND behavior (no results unless both in same paragraph)
- `Python OR 机器学习` → OR behavior (any match)
- `Python AND 机器学习` → explicit AND same as default
- Single term → works as before
- No-results AND query → shows "试试 OR 语法" hint

**Step 4: Final commit if any fixes needed, then done**
