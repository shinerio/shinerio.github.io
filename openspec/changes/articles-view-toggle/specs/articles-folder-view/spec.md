## ADDED Requirements

### Requirement: Directory path data generation
The `SiteGenerator` SHALL include a `relativePath` field in the serialized article JSON data (`#article-data`). The `relativePath` SHALL be the article's source file path relative to the vault root directory, using forward slashes as separators regardless of the build platform.

#### Scenario: Article data includes relativePath
- **WHEN** the site is generated with an article at vault path `技术/网络/article.md`
- **THEN** the serialized article JSON includes `"relativePath": "技术/网络/article.md"`

#### Scenario: Root-level article path
- **WHEN** an article is located directly in the vault root (not in any subdirectory)
- **THEN** the `relativePath` SHALL be just the filename, e.g. `"relativePath": "article.md"`

#### Scenario: Path separator normalization
- **WHEN** the build runs on Windows where `filePath` uses backslash separators
- **THEN** the `relativePath` SHALL use forward slashes (e.g. `技术/网络/article.md`)

### Requirement: Folder tree rendering
The folder view SHALL render a tree structure from the article `relativePath` data. Each directory SHALL be rendered as a collapsible folder node. Each article SHALL be rendered as a leaf node within its parent directory.

#### Scenario: Nested directory tree
- **WHEN** the folder view is active and articles exist at paths `技术/Go/intro.md`, `技术/Go/advanced.md`, and `生活/travel.md`
- **THEN** the tree displays: root contains folders `技术` and `生活`; `技术` contains folder `Go`; `Go` contains two article links; `生活` contains one article link

#### Scenario: Empty directory omission
- **WHEN** a directory in the vault contains no published articles (only drafts or non-markdown files)
- **THEN** that directory SHALL NOT appear in the folder tree

#### Scenario: Article leaf node display
- **WHEN** an article appears in the folder tree
- **THEN** it SHALL display as a clickable link showing the article title (not the filename), and clicking it SHALL navigate to the article detail page

### Requirement: Folder expand and collapse
Folder nodes in the tree SHALL be expandable and collapsible by clicking the folder name or a toggle icon. First-level directories SHALL be expanded by default. All deeper directories SHALL be collapsed by default.

#### Scenario: Default expansion state
- **WHEN** the folder view is first displayed
- **THEN** first-level directories are expanded and their immediate children (articles and subdirectories) are visible, while second-level and deeper directories are collapsed

#### Scenario: Toggle folder open
- **WHEN** a user clicks on a collapsed folder node
- **THEN** the folder expands to show its children (articles and subdirectories)

#### Scenario: Toggle folder closed
- **WHEN** a user clicks on an expanded folder node
- **THEN** the folder collapses and its children are hidden

### Requirement: Folder view article count
Each folder node SHALL display the total number of articles it contains (including articles in all nested subdirectories).

#### Scenario: Folder shows article count
- **WHEN** folder `技术` contains 2 direct articles and a subfolder `Go` with 3 articles
- **THEN** the `技术` folder node displays a count of 5

### Requirement: Folder view styling
The folder tree SHALL use indentation to indicate hierarchy level. Folder nodes SHALL display a folder icon and a toggle chevron. Article nodes SHALL display a document icon. The styling SHALL be consistent with the existing blog theme (light/dark mode support).

#### Scenario: Dark mode folder view
- **WHEN** the user has dark mode enabled and the folder view is active
- **THEN** the folder tree uses dark mode colors consistent with the rest of the site

#### Scenario: Indentation hierarchy
- **WHEN** an article is nested 3 levels deep (e.g. `A/B/C/article.md`)
- **THEN** the article node is indented 3 levels from the tree root
