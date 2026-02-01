# Tasks: Blacklist Configuration for Files and Folders

## Feature Overview

This feature adds a blacklist configuration option that allows users to specify files or folders that should not be published or deployed when generating the blog from the Obsidian vault. The blacklist is defined as an array of file or folder paths that will be excluded from the generation process.

## Implementation Strategy

The approach is to implement the blacklist functionality by:
1. Adding the blacklist property to the BlogConfig interface
2. Updating the ConfigManager to validate blacklist entries
3. Installing and integrating minimatch for pattern matching
4. Enhancing FileScanner to exclude blacklisted files/folders during scanning
5. Updating the main generator to pass the blacklist configuration to FileScanner

MVP scope will focus on User Story 1: Basic blacklist functionality that allows users to exclude specific files and folders.

## Dependencies

- **US2 depends on US1**: Advanced pattern matching requires basic blacklist implementation first
- **US3 depends on US1**: Logging and error handling for invalid paths relies on basic blacklist functionality

## Parallel Execution Examples

- Tasks T005-T007 ([P]) can run in parallel as they involve adding different components (types, config manager, file scanner)
- All test tasks can run in parallel with implementation tasks after the corresponding implementation is complete
- UI/documentation updates can run in parallel with implementation tasks

## Phase 1: Setup

- [X] T001 Install minimatch dependency for glob pattern matching
- [X] T002 Set up test files for blacklist functionality

## Phase 2: Foundational

- [X] T003 [P] Update BlogConfig interface in src/types/index.ts to include blacklist property
- [X] T004 [P] Update ConfigManager.validateConfig() method in src/core/ConfigManager.ts to validate blacklist entries
- [X] T005 [P] Enhance FileScanner.scanDirectory method in src/core/FileScanner.ts to support exclusion logic

## Phase 3: [US1] Basic Blacklist Functionality

**Goal**: Implement basic blacklist functionality that allows users to exclude specific files and folders from the generation process.

**Independent Test Criteria**: After completing this phase, users can specify files or folders in the blacklist array of their configuration, and those files/folders will be excluded from the blog generation process.

**Tasks**:
- [X] T006 [P] [US1] Import and configure minimatch in FileScanner for pattern matching
- [X] T007 [P] [US1] Implement helper function to check if a file or directory matches blacklist patterns in src/core/FileScanner.ts
- [X] T008 [US1] Modify FileScanner.scanDirectory to skip blacklisted directories
- [X] T009 [US1] Modify FileScanner.scanDirectory to skip blacklisted files
- [X] T010 [US1] Update FileScanner.scanVault method signature to accept blacklist parameter
- [X] T011 [US1] Update ObsidianBlogGenerator in src/index.ts to pass blacklist config to FileScanner
- [X] T012 [US1] Write unit tests for basic blacklist functionality in src/core/__tests__/FileScanner.test.ts

## Phase 4: [US2] Advanced Pattern Matching

**Goal**: Implement support for glob pattern matching in the blacklist configuration (wildcards, recursive patterns).

**Independent Test Criteria**: After completing this phase, users can use glob patterns like "*.tmp.md", "drafts/", and "**/temp/**" in their blacklist configuration.

**Tasks**:
- [X] T013 [US2] Enhance blacklist pattern matching to support wildcards and recursive patterns using minimatch
- [X] T014 [US2] Add validation for blacklist pattern syntax to ConfigManager
- [X] T015 [US2] Write unit tests for advanced pattern matching in src/core/__tests__/FileScanner.test.ts
- [X] T016 [US2] Create integration tests for glob patterns in test/integration/blacklist-patterns.test.ts

## Phase 5: [US3] Error Handling & Validation

**Goal**: Implement proper validation and error handling for blacklist configurations, including warnings for non-existent paths.

**Independent Test Criteria**: After completing this phase, the system logs appropriate warnings when blacklist entries reference non-existent files or folders but continues processing other files.

**Tasks**:
- [X] T017 [US3] Add validation to prevent path traversal attempts in blacklist entries
- [X] T018 [US3] Enhance error handling to warn about invalid paths in blacklist while continuing operation
- [X] T019 [US3] Update logging mechanism to include blacklist-specific messages
- [X] T020 [US3] Write tests for error handling scenarios in src/core/__tests__/FileScanner.test.ts

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T021 Update configuration validation to check for dangerous patterns
- [X] T022 Add documentation for blacklist feature to README
- [X] T023 Create example configuration with blacklist in examples/
- [X] T024 Run full test suite to ensure no regressions
- [X] T025 Performance test to ensure blacklist adds minimal overhead (<10% as required)
- [X] T026 Update CLI help text to include information about blacklist option
- [X] T027 Add type definitions for blacklist-related functionality