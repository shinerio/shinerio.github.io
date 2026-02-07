# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Obsidian Blog Generator - a tool that converts Obsidian vaults (collections of markdown notes) into minimalist, beautiful personal blog websites. The tool scans Obsidian markdown files, parses their metadata, generates static HTML pages, and includes search functionality.

## Architecture

The application follows a modular architecture with distinct components:

- **CLI Layer** (`src/cli.ts`): Handles command-line interface using Commander.js
- **Core Components** (`src/core/`):
  - `ConfigManager`: Manages configuration loading, validation and saving
  - `FileScanner`: Scans vault directories and handles file filtering via blacklists
  - `MetadataParser`: Parses YAML frontmatter and extracts metadata from markdown files
  - `SiteGenerator`: Generates the actual website with HTML pages, assets and templates
  - `SearchEngine` / `SearchCoordinator`: Builds search indexes for the generated site
  - `ErrorHandler`: Handles errors gracefully with progress reporting and breakpoints
- **Types** (`src/types/index.ts`): Defines all interfaces and error types
- **Main Entry Point** (`src/index.ts`): Orchestrates the entire blog generation process

## Key Features

- Automatic scanning of Obsidian vault markdown files
- YAML frontmatter metadata parsing
- Responsive design for desktop, tablet and mobile
- Built-in full-text search functionality
- Static site generation for easy deployment
- Support for blacklisting files/directories
- Custom domain support for GitHub Pages
- Error handling with progress reporting and breakpoint recovery

## Commands

### Development
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Run linter
npm run lint

# Fix lint issues
npm run lint:fix

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Running the Application
```bash
# Generate blog with default config
npx obsidian-blog generate

# Generate blog with custom config
npx obsidian-blog generate -c ./my-config.json

# Generate blog with verbose output
npx obsidian-blog generate -v

# Initialize a new config file
npx obsidian-blog init -o ./blog.config.json

# Validate config file
npx obsidian-blog validate -c ./blog.config.json
```

### Deployment
```bash
# Deploy with default config (locally)
./deploy.sh

# Deploy with custom config
./deploy.sh -c my-config.json

# Deploy to GitHub Pages
./deploy.sh -c my-config.json -d github

# Deploy to Vercel
./deploy.sh -c my-config.json -d vercel

# Deploy to Netlify
./deploy.sh -c my-config.json -d netlify

# Run in Docker
./deploy.sh -c my-config.json -d docker
```

## Configuration

The blog generator uses a `blog.config.json` file with the following structure:
- `vaultPath`: Path to your Obsidian vault (default: `"./vault"`)
- `outputPath`: Output directory for generated site (default: `"./dist"`)
- `siteTitle`: Website title
- `siteDescription`: Website description
- `author`: Author name
- `theme`: Theme setting (`light`, `dark`, or `auto`)
- `postsPerPage`: Number of posts per page (default: 10)
- `blacklist`: Array of file/directory patterns to exclude
- `customDomain`: Custom domain for GitHub Pages

## Blacklist Patterns

The `blacklist` configuration supports:
- `"*.tmp.md"` - Exclude all files ending with `.tmp.md`
- `"drafts/"` - Exclude entire drafts directory
- `"**/private/**"` - Exclude private directories at any depth
- Specific file paths like `"secret-notes/note.md"`

## Testing

Tests are located in the `test/` directory and use Jest with ts-jest for TypeScript support. Run tests with `npm run test` or `npm run test:watch` for continuous testing during development.

**Constraint**: All test-related code, configuration files, and test utilities must be placed in the `test/` directory to maintain proper separation of concerns between production and test code.

## Deployment Options

The application supports multiple deployment methods:
- GitHub Pages (with automatic CNAME generation)
- Vercel
- Netlify
- Docker
- Local preview