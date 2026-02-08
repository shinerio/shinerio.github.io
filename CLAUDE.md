# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Obsidian Blog Generator - a TypeScript-based static site generator that converts Obsidian vaults (collections of markdown notes) into minimalist, beautiful personal blog websites. It scans Obsidian markdown files, parses YAML frontmatter metadata, generates static HTML pages with responsive design, and includes weighted full-text search, GitHub Issues-based comments, and dark/light theme support.

## Architecture

The application follows a modular pipeline architecture:

```
Obsidian Vault → ConfigManager → FileScanner → MetadataParser → SearchCoordinator → SiteGenerator → Static Site
```

### Source Structure

```
src/
├── index.ts              # Main orchestrator (ObsidianBlogGenerator class)
├── cli.ts                # CLI interface (Commander.js: generate, init, validate)
├── types/index.ts        # All TypeScript interfaces, error classes, and types
└── core/
    ├── ConfigManager.ts       # Config loading, validation, and saving
    ├── FileScanner.ts         # Vault directory scanning with blacklist filtering
    ├── MetadataParser.ts      # YAML frontmatter extraction, markdown processing
    ├── SiteGenerator.ts       # HTML generation, template rendering, asset management
    ├── SearchCoordinator.ts   # Main search orchestrator (combines title + content engines)
    ├── TitleSearchEngine.ts   # Title-specific search index (weight: 3)
    ├── ContentSearchEngine.ts # Content-specific search index (weight: 1)
    ├── SearchEngine.ts        # Legacy combined search engine (kept for compatibility)
    └── ErrorHandler.ts        # Graceful error handling, progress reporting, breakpoints
```

### Templates & Assets

```
templates/
├── layout.html            # Base HTML template
├── index.html             # Home page (hero, recent articles, tag cloud, sidebar)
├── article.html           # Article page (content, comments, navigation)
├── articles.html          # Paginated article list with tag filtering
├── search.html            # Search interface with live results
└── assets/
    ├── css/style.css              # Main styles (responsive, dark/light themes)
    ├── css/style-addition.css     # Additional style overrides
    ├── js/articles-filters.js     # Client-side tag filtering & sorting
    └── images/avatar.png          # Profile avatar
```

### Generation Pipeline

The main process in `src/index.ts` runs 6 stages with progress tracking:
1. **CONFIG_LOADED** (15%) - Load and validate `blog.config.json`
2. **FILES_SCANNED** (30%) - Recursively scan vault, apply blacklist patterns
3. **ARTICLES_PARSED** (50%) - Parse YAML frontmatter, process markdown content
4. **SEARCH_INDEXED** (70%) - Build weighted search indices (title + content)
5. **SITE_GENERATED** (85%) - Render HTML pages, copy assets, generate CNAME
6. **SEARCH_DATA_SAVED** (100%) - Export `search-data.json` for client-side search

### Search Architecture

The search system uses a two-engine weighted approach via `SearchCoordinator`:
- **TitleSearchEngine** - Indexes article titles with weight 3 (highest relevance)
- **ContentSearchEngine** - Indexes article body text with weight 1
- Tags are scored with weight 2
- Supports Chinese character tokenization and English stop word filtering
- Results include match location indicators (inTitle, inContent, inTags) and highlighted snippets

### Error Handling & Recovery

- File/parse errors produce warnings and skip individual files (non-fatal)
- Config/generation errors are fatal and halt the process
- Breakpoint system saves state at each pipeline stage to a temp directory
- Resume from breakpoint with `--resume` flag; auto-cleanup on success

## Key Features

- Automatic scanning of Obsidian vault markdown files
- YAML frontmatter metadata parsing (title, date, tags, description, draft, slug)
- Obsidian internal link (`[[text]]`) and hashtag processing
- Mixed Chinese/English word counting
- Responsive design for desktop, tablet, and mobile
- Dark/light/auto theme with toggle
- Weighted full-text search (title > tags > content)
- GitHub Issues-based comment system via Utterances
- GitHub profile link and follow button on sidebar
- Blacklist filtering with glob patterns
- Custom domain support for GitHub Pages
- Breakpoint recovery for interrupted generation
- Paginated article listing with tag filtering

## Commands

### Development
```bash
npm install          # Install dependencies
npm run build        # Build TypeScript
npm run dev          # Watch mode for development
npm run lint         # Run linter
npm run lint:fix     # Fix lint issues
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Running the Application
```bash
npx obsidian-blog generate                   # Generate with default config
npx obsidian-blog generate -c ./config.json  # Generate with custom config
npx obsidian-blog generate -v                # Generate with verbose output
npx obsidian-blog generate --resume          # Resume from breakpoint
npx obsidian-blog init -o ./blog.config.json # Initialize a new config file
npx obsidian-blog validate -c ./config.json  # Validate config file
```

### Deployment
```bash
./deploy.sh                            # Deploy with default config (locally)
./deploy.sh -c my-config.json          # Deploy with custom config
./deploy.sh -c my-config.json -d github  # Deploy to GitHub Pages
./deploy.sh -c my-config.json -d vercel  # Deploy to Vercel
./deploy.sh -c my-config.json -d netlify # Deploy to Netlify
./deploy.sh -c my-config.json -d docker  # Run in Docker
```

Windows: use `deploy.bat` with the same parameters.

## Configuration

The blog generator uses a `blog.config.json` file with the following fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `vaultPath` | string | `"./vault"` | Path to Obsidian vault |
| `outputPath` | string | `"./dist"` | Output directory for generated site |
| `siteTitle` | string | - | Website title |
| `siteDescription` | string | - | Website description |
| `author` | string | - | Author name |
| `theme` | string | `"auto"` | Theme setting: `light`, `dark`, or `auto` |
| `postsPerPage` | number | `10` | Number of posts per page |
| `blacklist` | string[] | `[]` | File/directory patterns to exclude (glob) |
| `customDomain` | string | - | Custom domain for GitHub Pages |
| `githubUrl` | string | - | GitHub profile URL (displayed in sidebar) |
| `comments` | object | - | Comment system config (see below) |

### Comments Configuration

```json
{
  "comments": {
    "enabled": true,
    "repo": "owner/repo",
    "issueTerm": "pathname",
    "label": "blog-comment"
  }
}
```

- `enabled` (boolean, required): Enable/disable comments
- `repo` (string, required): GitHub repo in `"owner/repo"` format
- `issueTerm` (string): Issue mapping - `pathname` (default), `title`, `og:title`, or `url`
- `label` (string): Label for comment issues

### Blacklist Patterns

Supports glob patterns:
- `"*.tmp.md"` - Exclude files ending with `.tmp.md`
- `"drafts/"` - Exclude entire drafts directory
- `"**/private/**"` - Exclude private directories at any depth
- `"secret-notes/note.md"` - Exclude specific file

## Testing

Tests are in the `test/` directory using Jest with ts-jest. The test suite includes:

- **Unit tests** (`test/unit/`): ConfigManager, FileScanner, MetadataParser, SiteGenerator, ErrorHandler, SearchCoordinator, TitleSearchEngine, ContentSearchEngine, SearchEngine, ArticleIndexing, SearchEngineValidation, ContentOnlySearch, Integration
- **Integration tests** (`test/integration/`): Blacklist pattern matching
- **Test setup** (`test/setup/`): Environment configuration and mocks
- Uses **fast-check** for property-based testing

**Constraint**: All test-related code, configuration files, and test utilities must be placed in the `test/` directory to maintain proper separation of concerns between production and test code.

## Dependencies

### Runtime
- **commander** (^11.0.0) - CLI framework
- **fs-extra** (^11.0.0) - Enhanced file system operations
- **gray-matter** (^4.0.3) - YAML frontmatter parsing
- **marked** (^9.0.0) - Markdown to HTML conversion

### Development
- **typescript** (^5.0.0), **ts-jest** (^29.1.0), **jest** (^29.5.0)
- **eslint** (^8.0.0), **@typescript-eslint/** (^6.0.0)
- **fast-check** (^3.23.2) - Property-based testing

## Deployment Options

- GitHub Pages (with automatic CNAME generation)
- Vercel
- Netlify
- Docker
- Local preview