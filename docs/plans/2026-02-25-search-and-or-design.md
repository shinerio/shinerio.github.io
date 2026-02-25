# Search AND/OR Syntax Feature Design

**Date:** 2026-02-25
**Status:** Approved

## Overview

Enhance the search page to support AND/OR paragraph-level matching syntax, allowing users to find articles where multiple keywords co-occur in the same paragraph (AND) or where any keyword appears (OR).

## Requirements

- **AND (default)**: All keywords must appear in the same paragraph
- **OR**: Any keyword appearing in any paragraph qualifies
- Inline operator syntax in the search box: `keyword1 AND keyword2`, `keyword1 OR keyword2`
- Space-separated terms default to AND
- Matching paragraph shown as snippet in results

## Architecture

### Data Layer — `generateSearchData()` output format

Change `content: string` (first 200 chars) to `paragraphs: string[]` (full content, pre-split by paragraph).

```json
{
  "articles": [
    {
      "id": "article-id",
      "title": "文章标题",
      "paragraphs": [
        "第一段内容，已清洗掉 markdown 符号",
        "第二段内容...",
        "第三段内容..."
      ],
      "tags": ["tag1", "tag2"],
      "slug": "article-slug"
    }
  ]
}
```

**Paragraph splitting (server-side in `SearchCoordinator.generateSearchData()`):**
- Apply `extractSearchableContent()` first to clean markdown
- Split cleaned text by `\n\n`
- Filter out empty paragraphs and segments shorter than 10 characters

### Query Parsing (client-side)

Parse the raw query string to extract terms and operator:

| Input | terms | operator |
|-------|-------|----------|
| `Python 机器学习` | `["python", "机器学习"]` | `AND` (default) |
| `Python AND 机器学习` | `["python", "机器学习"]` | `AND` |
| `Python OR 深度学习` | `["python", "深度学习"]` | `OR` |

Rules:
- Split by whitespace; tokens matching `AND`/`OR` (case-insensitive) become the operator, not search terms
- Only a single operator per query (first one wins); rest treated as terms
- Default operator is **AND** when no operator token is present

### Search Logic (client-side)

**AND mode:**
- An article matches if at least one paragraph contains **all** keywords
- Score = number of paragraphs satisfying the condition × number of terms
- Snippet = first paragraph that satisfies the condition

**OR mode:**
- An article matches if any paragraph contains any keyword
- Score = same as current (title/tags weighted higher)
- Snippet = first paragraph containing any keyword

### UI Changes

- `search.html` placeholder: `Search articles... (多词默认AND，支持 OR 语法)`
- AND no-results message: `未找到所有关键词同时出现在同一段落的文章，试试 OR 语法`
- Result snippets highlight all matched keywords

## Files to Modify

| File | Change |
|------|--------|
| `src/core/SearchCoordinator.ts` | `generateSearchData()`: output `paragraphs[]` instead of `content` string |
| `templates/layout.html` | Update client-side `performSearch()` with query parsing + AND/OR logic |
| `templates/search.html` | Update placeholder text |

## Non-Goals

- Mixed AND/OR in a single query (`a AND b OR c`) — not supported
- Phrase search (`"exact phrase"`) — not in scope
- Server-side search API changes — search remains fully client-side
