# Implementation Plan: Blacklist Configuration for Files and Folders

## Technical Context

The Obsidian Blog Generator currently supports scanning and processing all Markdown files in a vault directory. The architecture consists of:
- `ConfigManager`: Handles configuration loading and validation
- `FileScanner`: Discovers Markdown files in the vault
- `BlogConfig`: Defines the configuration interface

The blacklist feature requires modifying both components to allow users to specify files or folders that should be excluded from processing. Currently, the `BlogConfig` interface does not include a blacklist property, and the `FileScanner` doesn't implement exclusion logic.

## Constitution Check

Based on the project constitution (placeholder), this feature follows the core principles of:
- Extending existing components rather than creating new ones
- Maintaining backward compatibility
- Providing clear configuration options for users

## Gates

- ✅ **Architecture Compatibility**: The implementation fits within the existing architecture by extending existing interfaces and modules
- ✅ **Backward Compatibility**: Default behavior remains unchanged; blacklist is optional
- ✅ **Test Strategy**: Unit and integration tests can be written for the new functionality
- ✅ **Performance Impact**: The exclusion check should have minimal impact on performance

## Phase 0: Research

### Research Summary

#### Decision: Configuration Field Name and Type
**Rationale**: Added a `blacklist` field to the `BlogConfig` interface as an array of strings to represent file and folder paths to exclude.
**Alternatives considered**:
- Using an object with different types of exclusions (files, folders, patterns separately)
- Using a single string with comma-separated values
- Using a dedicated exclusion configuration object

#### Decision: FileScanner Integration Approach
**Rationale**: Modify the `scanDirectory` method in `FileScanner` to check against the blacklist before adding files to the result, implementing the exclusion at the earliest possible point in the pipeline.
**Alternatives considered**:
- Filtering results after scanning is complete
- Creating a separate exclusion layer/module
- Adding exclusion logic in the metadata parser

#### Decision: Pattern Matching Implementation
**Rationale**: Use the `minimatch` library for robust glob pattern matching, supporting standard wildcard patterns like `*.md`, `**/temp/**`, etc.
**Alternatives considered**:
- Using Node.js built-in `glob` library (requires async operations)
- Implementing a custom pattern matching solution
- Using regular expressions for pattern matching

## Phase 1: Design & Data Models

### Data Model: Updated BlogConfig

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

### API Contracts

#### Updated FileScanner Methods
- `scanVault(vaultPath: string, blacklist: string[] = [])`: Added optional blacklist parameter to enhance file scanning with exclusion logic

#### Updated ConfigManager Methods
- `validateConfig(config: BlogConfig)`: Extended to validate the new blacklist property

### Quickstart Guide Addition

Add the following example to documentation:

```json
{
  "vaultPath": "./vault",
  "outputPath": "./dist",
  "siteTitle": "My Obsidian Blog",
  "blacklist": [
    "drafts/",
    "temp/",
    "*.tmp.md",
    "secret-notes/personal-diary.md",
    "**/private/**"
  ]
}
```

## Phase 2: Implementation Tasks

### Task 1: Update BlogConfig Interface
Modify `src/types/index.ts` to add the blacklist property with proper type definition.

### Task 2: Update Configuration Validation
Extend `ConfigManager.validateConfig()` to validate the blacklist entries, ensuring they're properly formatted paths/patterns.

### Task 3: Install and Configure Minimatch
Install the `minimatch` library for robust glob pattern matching and integrate it into the FileScanner.

### Task 4: Enhance FileScanner with Exclusion Logic
Modify the `FileScanner.scanDirectory` method to check if files or directories match any blacklist entries before adding them to the scan results.

### Task 5: Update ObsidianBlogGenerator to Pass Blacklist
Modify the main generator class to pass the blacklist configuration to the FileScanner during the scanning phase.

### Task 6: Add Comprehensive Unit Tests
Create unit tests for all modified components to ensure:
- Configuration validation works correctly with blacklist
- FileScanner properly excludes blacklisted files and directories
- Pattern matching works as expected
- Backward compatibility is maintained

### Task 7: Integration Testing
Create integration tests to verify the complete flow from configuration loading to file scanning with blacklist entries.

## Phase 3: Quality Assurance

### Code Quality Gates
- All new code must pass ESLint checks
- Type safety must be maintained
- Proper error handling for invalid blacklist patterns

### Testing Gates
- 90% code coverage for new functionality
- All existing tests must continue to pass
- Performance impact must be under 10% for the scanning phase

## Re-evaluated Constitution Check Post-Design

✅ **Maintains Library-First Approach**: Enhancement extends existing modules without breaking modularity
✅ **Preserves CLI Interface**: No changes to CLI interface required
✅ **Test-First Compliant**: Tests will be written alongside implementation
✅ **Observable Changes**: New configuration option will be clearly logged during execution