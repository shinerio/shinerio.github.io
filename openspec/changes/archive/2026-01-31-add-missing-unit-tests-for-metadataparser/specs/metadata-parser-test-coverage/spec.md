## ADDED Requirements

### Requirement: Calculate word count accurately for mixed content

The calculateWordCount method SHALL accurately count words in content with various formats including English text, Chinese characters, code blocks, and other markdown elements.

#### Scenario: Calculate word count for English content

- **WHEN** content contains English text like "Hello world this is a test"
- **THEN** word count SHALL equal the number of English words (5 in this example)
- **AND** code blocks and markdown syntax SHALL not be counted as words

#### Scenario: Calculate word count for Chinese content

- **WHEN** content contains Chinese characters
- **THEN** each Chinese character SHALL be counted as one word
- **AND** mixed English and Chinese SHALL be counted appropriately

#### Scenario: Calculate word count excluding code blocks

- **WHEN** content contains code blocks marked with ``` or `
- **THEN** text within code blocks SHALL not be included in word count
- **AND** only content outside code blocks SHALL be counted

### Requirement: Generate URL-friendly slugs correctly

The createSlug method SHALL transform text into URL-friendly format consistently.

#### Scenario: Create slug from various text inputs

- **WHEN** input text contains spaces, special characters, or mixed languages
- **THEN** output SHALL contain only alphanumeric characters, hyphens, and Chinese characters
- **AND** spaces and underscores SHALL be converted to hyphens

#### Scenario: Create slug preserving readability

- **WHEN** input text contains mixed case or special formatting
- **THEN** output SHALL be lowercase and URL-friendly
- **AND** meaningful text SHALL be preserved

### Requirement: Handle errors gracefully during file parsing

The parseFile method SHALL properly handle and propagate errors when file operations fail.

#### Scenario: Handle invalid file during parsing

- **WHEN** parseFile is called with a non-existent file path
- **THEN** a ParseError SHALL be thrown with appropriate message
- **AND** the error SHALL include the file path that failed

#### Scenario: Handle corrupted markdown content

- **WHEN** markdown file contains malformed content
- **THEN** a ParseError SHALL be thrown with appropriate message
- **AND** the error SHALL include the file path that failed