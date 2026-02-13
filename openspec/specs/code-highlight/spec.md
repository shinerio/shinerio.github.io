## ADDED Requirements

### Requirement: Syntax highlighting for fenced code blocks
The system SHALL apply syntax highlighting to all fenced code blocks on article pages using Highlight.js loaded from a CDN. Code blocks with a language class (e.g., `language-javascript`) SHALL be highlighted according to that language's grammar. Code blocks without a language class SHALL use Highlight.js auto-detection.

#### Scenario: Code block with explicit language renders with highlighting
- **WHEN** an article contains a fenced code block with a language identifier (e.g., ` ```javascript `)
- **THEN** the rendered HTML code block SHALL display syntax-highlighted code with appropriate color tokens for that language

#### Scenario: Code block without language identifier uses auto-detection
- **WHEN** an article contains a fenced code block without a language identifier (e.g., ` ``` `)
- **THEN** the system SHALL attempt auto-detection via Highlight.js and apply best-effort highlighting

#### Scenario: Highlight.js CDN is unreachable
- **WHEN** the Highlight.js CDN resource fails to load
- **THEN** code blocks SHALL render with the existing basic styling (monospace font, background color, border) without syntax highlighting

### Requirement: Light and dark theme support for syntax highlighting
The system SHALL provide syntax highlighting themes that match the site's light and dark modes. When the user toggles the site theme, highlighting colors SHALL update accordingly.

#### Scenario: Light theme active
- **WHEN** the site is in light mode (no `data-theme` attribute or `data-theme="light"`)
- **THEN** code blocks SHALL use a light-background highlight theme (e.g., GitHub Light)

#### Scenario: Dark theme active
- **WHEN** the site is in dark mode (`data-theme="dark"`)
- **THEN** code blocks SHALL use a dark-background highlight theme (e.g., GitHub Dark)

#### Scenario: Theme toggled while viewing article
- **WHEN** the user clicks the theme toggle button while an article with code blocks is displayed
- **THEN** the syntax highlighting colors SHALL switch to the corresponding theme immediately without page reload

### Requirement: Language indicator badge on code blocks
The system SHALL display a language label badge on code blocks that have an identified language. The badge SHALL show the language name (e.g., "JavaScript", "Python", "HTML") in the top-right area of the code block.

#### Scenario: Code block with known language shows badge
- **WHEN** a code block has a detected or specified language
- **THEN** a language badge SHALL be visible in the top-right corner of the code block displaying the language name

#### Scenario: Code block with no detectable language shows no badge
- **WHEN** a code block has no language identifier and auto-detection does not identify a language
- **THEN** no language badge SHALL be displayed
