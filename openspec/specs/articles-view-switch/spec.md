### Requirement: View toggle buttons
The articles page SHALL display a view toggle control in the filter bar area containing two icon buttons: a list icon for list view and a folder icon for folder view. The currently active view button SHALL have a visually distinct active state.

#### Scenario: Toggle buttons rendered
- **WHEN** the articles page loads
- **THEN** two view toggle buttons (list and folder icons) are visible in the filter area, and the list view button has the active style

#### Scenario: Active button indicator
- **WHEN** the user is in folder view
- **THEN** the folder icon button has the active style and the list icon button does not

### Requirement: View switching behavior
Clicking a view toggle button SHALL switch the visible content area between list view and folder view without a page reload. When list view is active, the article list container and filter/sort controls SHALL be visible. When folder view is active, the folder tree container SHALL be visible and the article list container, pagination, and filter/sort controls SHALL be hidden.

#### Scenario: Switch to folder view
- **WHEN** the user clicks the folder view button while in list view
- **THEN** the list view (article list, pagination, filter controls) is hidden and the folder tree is displayed

#### Scenario: Switch to list view
- **WHEN** the user clicks the list view button while in folder view
- **THEN** the folder tree is hidden and the list view (article list, pagination, filter controls) is displayed

#### Scenario: No data reload on switch
- **WHEN** the user switches between views multiple times
- **THEN** no additional network requests are made; both views use the already-loaded article data

### Requirement: Default view
The articles page SHALL display the list view by default when no `view` URL parameter is present.

#### Scenario: Default view on fresh load
- **WHEN** a user navigates to `articles.html` (no query parameters)
- **THEN** the list view is displayed

### Requirement: View state URL persistence
The current view mode SHALL be persisted in the URL query parameter `view` with values `list` or `folder`. The system SHALL use `history.replaceState` to update the URL without triggering a page reload. On page load, the system SHALL read the `view` parameter to determine the initial view.

#### Scenario: URL reflects folder view
- **WHEN** the user switches to folder view
- **THEN** the URL updates to include `?view=folder` (preserving any existing `tag` parameter)

#### Scenario: URL reflects list view
- **WHEN** the user switches to list view
- **THEN** the `view` parameter is removed from the URL (list is the default)

#### Scenario: Load with view parameter
- **WHEN** a user navigates to `articles.html?view=folder`
- **THEN** the folder view is displayed initially

#### Scenario: Combined tag and view parameters
- **WHEN** a user navigates to `articles.html?tag=network&view=folder`
- **THEN** the folder view is displayed (tag parameter is preserved but only affects list view)
