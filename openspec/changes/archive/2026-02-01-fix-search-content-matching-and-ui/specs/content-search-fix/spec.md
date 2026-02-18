## ADDED Requirements

### Requirement: Correct content-only search matching
When performing content-only searches, the system SHALL match against the actual content of articles rather than against their titles.

#### Scenario: Content-only search matches content
- **WHEN** user performs a content-only search for a term that exists in article content but not in the title
- **THEN** the system returns articles containing that term in their content

#### Scenario: Content-only search excludes title matches
- **WHEN** user performs a content-only search for a term that exists only in article titles
- **THEN** the system excludes those articles from results

### Requirement: Preserve existing search functionality
The fix SHALL not break existing search behaviors for title-only or combined searches.

#### Scenario: Title-only search still works
- **WHEN** user performs a title-only search
- **THEN** system returns results based on title matching as before

#### Scenario: Combined search still works
- **WHEN** user performs a combined title and content search
- **THEN** system returns results based on both title and content matching as before