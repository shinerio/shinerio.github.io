# Quickstart Guide: Blacklist Configuration

## Overview
The blacklist configuration allows you to exclude specific files or folders from your blog generation process. This is useful for keeping drafts, private notes, or work-in-progress content from being published.

## Configuration Setup

### 1. Enable Blacklist in Your Config File
Add the `blacklist` property to your `blog.config.json`:

```json
{
  "vaultPath": "./vault",
  "outputPath": "./dist",
  "siteTitle": "My Obsidian Blog",
  "blacklist": [
    "drafts/",
    "temp/",
    "*.tmp.md",
    "private-notes/personal-diary.md",
    "**/private/**"
  ]
}
```

### 2. Understanding Blacklist Patterns

#### File Patterns
- `"folder/filename.md"` - Excludes a specific file
- `"*.draft.md"` - Excludes all files with `.draft.md` extension
- `"notes/temp-*.md"` - Excludes files matching the pattern

#### Folder Patterns
- `"drafts/"` - Excludes the entire drafts folder and all its contents
- `"**/private/**"` - Excludes any folder named "private" anywhere in your vault
- `"temp/**"` - Excludes everything inside temp folder (but keeps the folder)

#### Glob Patterns
- `**` - Matches zero or more directories
- `*` - Matches any character except "/"
- `?` - Matches a single character except "/"

## Examples

### Basic Usage
```json
{
  "blacklist": [
    "drafts/",           // Exclude entire drafts folder
    "temp.md"           // Exclude specific file
  ]
}
```

### Advanced Patterns
```json
{
  "blacklist": [
    "drafts/",                    // Exclude drafts folder
    "*.tmp.md",                  // Exclude all files with .tmp.md extension
    "**/private/**",             // Exclude any folder named "private"
    "notes/work-notes-*.md",     // Exclude work notes with wildcard
    "archive/**/old-*.md"        // Complex pattern matching
  ]
}
```

## How It Works

1. During the scanning phase, the FileScanner checks each file and folder against your blacklist patterns
2. Files or folders that match any pattern in the blacklist are completely excluded from processing
3. Excluded files will not appear in your generated blog
4. The process continues normally for all non-blacklisted files

## Best Practices

- Use specific patterns to avoid accidentally excluding files you want to publish
- Test your configuration with a small subset of files first
- Remember that patterns are case-sensitive on Unix systems
- Use relative paths from your vault directory

## Troubleshooting

- If files aren't being excluded, check your pattern syntax
- Patterns like `drafts/` exclude the entire folder, not just the top-level files
- Use forward slashes for paths even on Windows
- Verify that your config file is being loaded by checking the console output during generation