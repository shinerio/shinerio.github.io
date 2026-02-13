## ADDED Requirements

### Requirement: Copy-to-clipboard button on code blocks
The system SHALL display a copy button on every fenced code block. Clicking the button SHALL copy the code block's text content to the user's clipboard.

#### Scenario: User clicks copy button
- **WHEN** the user clicks the copy button on a code block
- **THEN** the full text content of that code block (without HTML tags) SHALL be copied to the clipboard

#### Scenario: Copy succeeds with visual feedback
- **WHEN** the clipboard write operation succeeds
- **THEN** the copy button SHALL display a brief success indicator (e.g., checkmark icon or "Copied!" text) for approximately 2 seconds before reverting to its default state

#### Scenario: Copy fails gracefully
- **WHEN** the clipboard write operation fails (e.g., browser does not support Clipboard API and fallback also fails)
- **THEN** the copy button SHALL not produce an error visible to the user; the button returns to its default state

### Requirement: Copy button positioning and styling
The copy button SHALL be positioned in the top-right corner of the code block, visually unobtrusive but discoverable. It SHALL be styled consistently in both light and dark themes.

#### Scenario: Button visibility on hover
- **WHEN** the user hovers over a code block
- **THEN** the copy button SHALL be fully visible

#### Scenario: Button appearance in light theme
- **WHEN** the site is in light mode
- **THEN** the copy button SHALL use colors and styling consistent with the light theme

#### Scenario: Button appearance in dark theme
- **WHEN** the site is in dark mode
- **THEN** the copy button SHALL use colors and styling consistent with the dark theme

### Requirement: Copy button does not interfere with code selection
The copy button SHALL not prevent the user from selecting and manually copying code text using standard browser text selection.

#### Scenario: User selects text in code block
- **WHEN** the user clicks and drags to select text within a code block
- **THEN** the text selection SHALL work normally and the copy button SHALL not block or interfere with the selection
