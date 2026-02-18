## Why

The MetadataParser class is critical for processing Obsidian notes and converting them to blog articles, but it lacks comprehensive unit tests for some important functionality. Specifically, the word count calculation and slug generation functions need better test coverage to ensure reliability and prevent regressions.

## What Changes

- Add unit tests for the `calculateWordCount` method to verify proper word counting for various content types
- Add unit tests for the `createSlug` method to verify proper URL-friendly slug generation
- Add error handling tests for the `parseFile` method to ensure proper error propagation
- Add edge case tests for various markdown content scenarios

## Capabilities

### New Capabilities
- `metadata-parser-test-coverage`: Enhanced test suite for MetadataParser class

### Modified Capabilities
<!-- If modifying existing behavior -->

## Impact

- `src/core/__tests__/MetadataParser.test.ts`: Add missing test cases
- `src/core/MetadataParser.ts`: No changes needed (only adding tests)