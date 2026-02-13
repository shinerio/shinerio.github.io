## ADDED Requirements

### Requirement: Text selection triggers comment toolbar
The system SHALL display a floating toolbar with a comment button when the user selects text within the article `.content` section.

#### Scenario: User selects text in article content
- **WHEN** the user selects one or more characters within the article `.content` section
- **THEN** a floating toolbar with a comment icon button SHALL appear above the selection

#### Scenario: User selects text outside content area
- **WHEN** the user selects text outside the `.content` section (e.g., header, sidebar, comments)
- **THEN** the floating toolbar SHALL NOT appear

#### Scenario: User clears selection
- **WHEN** the user clicks elsewhere or deselects text
- **THEN** the floating toolbar SHALL disappear

### Requirement: Comment submission form
The system SHALL display a comment input form when the user clicks the comment button on the floating toolbar.

#### Scenario: User clicks comment button
- **WHEN** the user clicks the comment button on the floating toolbar
- **THEN** a comment popover SHALL appear near the selection with a text input area and submit button

#### Scenario: User submits a comment
- **WHEN** the user enters comment text and clicks submit
- **THEN** the system SHALL store the comment with the selected text, context (prefix/suffix), paragraph index, author, and timestamp
- **AND** the selected text SHALL be highlighted with a visible marker
- **AND** the comment popover SHALL close

#### Scenario: User submits empty comment
- **WHEN** the user clicks submit without entering any text
- **THEN** the system SHALL NOT create a comment and SHALL show a validation hint

#### Scenario: User cancels comment
- **WHEN** the user clicks outside the comment popover or presses Escape
- **THEN** the comment popover SHALL close without saving

### Requirement: Comment highlight rendering
The system SHALL visually highlight text segments that have associated comments.

#### Scenario: Page loads with existing comments
- **WHEN** the article page loads and there are existing text selection comments for this article
- **THEN** the system SHALL locate each commented text segment using stored context and wrap it with a highlight marker

#### Scenario: Comment text cannot be located
- **WHEN** the stored text segment cannot be found in the article content (e.g., article was edited)
- **THEN** the system SHALL collect unlocated comments and display them in a summary section at the end of the article content area

### Requirement: Comment hover display
The system SHALL display comment content in a tooltip when the user hovers over highlighted text.

#### Scenario: User hovers over highlighted text
- **WHEN** the user moves the mouse over a highlighted comment marker
- **THEN** a tooltip SHALL appear showing the comment text, author, and date

#### Scenario: Multiple comments on same text
- **WHEN** multiple comments exist for the same or overlapping text segment
- **THEN** the tooltip SHALL display all associated comments in chronological order

#### Scenario: User moves mouse away
- **WHEN** the user moves the mouse away from the highlighted text
- **THEN** the tooltip SHALL disappear

### Requirement: Data isolation from Utterances comments
The system SHALL store text selection comments independently from the bottom Utterances comment system.

#### Scenario: Text annotation issue creation
- **WHEN** a text selection comment is submitted for an article that has no existing annotation issue
- **THEN** the system SHALL create a new GitHub Issue with title format `[annotation] <article-slug>` and a distinct label (e.g., `text-annotation`)

#### Scenario: Text annotation appended to existing issue
- **WHEN** a text selection comment is submitted for an article that already has an annotation issue
- **THEN** the system SHALL add a new comment to the existing annotation issue
- **AND** SHALL NOT affect the Utterances comment issue

#### Scenario: Loading annotations
- **WHEN** the article page loads
- **THEN** the system SHALL fetch comments only from the issue matching `[annotation] <article-slug>` title and `text-annotation` label
- **AND** SHALL NOT load or display Utterances comments

### Requirement: GitHub authentication for commenting
The system SHALL require GitHub authentication before allowing comment submission.

#### Scenario: Unauthenticated user selects text
- **WHEN** an unauthenticated user selects text and clicks the comment button
- **THEN** the system SHALL prompt the user to authenticate via GitHub OAuth before showing the comment form

#### Scenario: Authenticated user submits comment
- **WHEN** an authenticated user submits a comment
- **THEN** the system SHALL use the stored OAuth token to create the comment via GitHub Issues API

### Requirement: Theme support
The system SHALL adapt its visual appearance to match the current site theme (light/dark).

#### Scenario: Light theme active
- **WHEN** the site is in light theme mode
- **THEN** the toolbar, popover, highlights, and tooltips SHALL use light-theme-appropriate colors

#### Scenario: Dark theme active
- **WHEN** the site is in dark theme mode
- **THEN** the toolbar, popover, highlights, and tooltips SHALL use dark-theme-appropriate colors

#### Scenario: Theme toggle
- **WHEN** the user toggles the site theme while the article page is open
- **THEN** all text selection comment UI elements SHALL update to match the new theme
