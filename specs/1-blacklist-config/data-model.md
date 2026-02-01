# Data Model: Blacklist Configuration for Files and Folders

## Overview
This document describes the data models introduced or modified to support the blacklist configuration feature that allows users to specify files or folders to exclude from the blog generation process.

## Updated BlogConfig Interface

### Definition
```typescript
export interface BlogConfig {
  vaultPath: string;
  outputPath: string;
  backupPath?: string;
  backupMode?: boolean;
  siteTitle: string;
  siteDescription: string;
  author: string;
  theme: 'light' | 'dark' | 'auto';
  postsPerPage: number;
  blacklist?: string[]; // NEW: Array of file/folder paths to exclude
}
```

### Properties
- **blacklist** (optional array of strings)
  - Type: `string[]`
  - Default: `[]` (empty array)
  - Purpose: Contains file and folder paths to exclude from processing
  - Format: Relative paths from the vault directory, supporting glob patterns

## Blacklist Entry Patterns

### Types of Entries Supported
1. **Specific Files**: `"folder/note.md"` - Matches a specific file
2. **Folders**: `"drafts/"` - Matches a folder and all its contents recursively
3. **Wildcard Files**: `"*.tmp.md"` - Matches all files with the .tmp.md extension
4. **Recursive Patterns**: `"**/temp/**"` - Matches temp folders anywhere in the vault
5. **Pattern Combinations**: `"drafts/*.md"` - Matches all .md files in drafts folder

### Validation Rules
- All paths must be relative to the vault directory
- Forward slashes are used as path separators (converted automatically from backslashes on Windows)
- Empty strings are not allowed in the blacklist
- Paths should not contain `..` to move up directories for security reasons

## Updated ScanResult Structure

### Definition
```typescript
export interface ScanResult {
  files: string[];
  errors: ScanError[];
  totalSize: number;
}
```

### Changes
- No structural changes to ScanResult, but the `files` array will now exclude any files that matched blacklist patterns
- The exclusion happens during the scanning phase, so blacklisted files are never added to the results

## Enhanced FileScanner Parameters

### Method Signature Update
```typescript
async scanVault(vaultPath: string, blacklist: string[] = []): Promise<ScanResult>
```

### Parameters
- **vaultPath**: The path to the vault directory to scan
- **blacklist**: Array of glob patterns to exclude from scanning (optional, defaults to empty array)

## Configuration Validation Updates

### ValidationResult Changes
The validation process will now check the blacklist array for:
- Correct data type (array of strings)
- Proper pattern syntax
- Security checks for dangerous patterns