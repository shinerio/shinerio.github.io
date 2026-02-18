# Test Directory

This directory contains all test-related files for the Obsidian Blog Generator project, organized by test type:

## Structure

- `unit/` - Unit tests for individual functions and components
- `integration/` - Integration tests for system-level functionality
- `setup/` - Test configuration and setup files

## Running Tests

To run all tests for the project, use the standard npm commands from the project root:

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage reports
```

## Test Types

- **Unit Tests**: Located in `unit/`, these test individual functions, classes, and modules in isolation.
- **Integration Tests**: Located in `integration/`, these test interactions between multiple components.
- **Test Setup**: Located in `setup/`, these contain configuration, mock definitions, and test utilities.