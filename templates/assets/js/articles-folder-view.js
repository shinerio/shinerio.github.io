// Folder view for articles page - builds tree from relativePath data
(function() {
  'use strict';

  /**
   * Build a tree structure from flat article list with relativePath
   * @param {Array} articles - articles with relativePath field
   * @returns {Object} tree root node
   */
  function buildFolderTree(articles) {
    var root = { name: '/', children: {}, articles: [] };

    articles.forEach(function(article) {
      if (!article.relativePath) return;

      var parts = article.relativePath.split('/');
      var fileName = parts.pop(); // remove the file name
      var current = root;

      // Walk down the path, creating folder nodes as needed
      parts.forEach(function(folderName) {
        if (!current.children[folderName]) {
          current.children[folderName] = {
            name: folderName,
            children: {},
            articles: []
          };
        }
        current = current.children[folderName];
      });

      // Add article to the deepest folder
      current.articles.push(article);
    });

    return root;
  }

  /**
   * Count total articles in a node (including all nested children)
   * @param {Object} node - tree node
   * @returns {number} total article count
   */
  function countArticles(node) {
    var count = node.articles.length;
    var childNames = Object.keys(node.children);
    for (var i = 0; i < childNames.length; i++) {
      count += countArticles(node.children[childNames[i]]);
    }
    return count;
  }

  /**
   * Render the folder tree into DOM elements
   * @param {Object} node - tree node
   * @param {number} depth - current depth (0 = root)
   * @returns {HTMLElement} rendered tree element
   */
  function renderTree(node, depth) {
    var ul = document.createElement('ul');
    ul.className = 'folder-tree-level';
    if (depth > 0) {
      ul.setAttribute('data-depth', depth);
    }

    // Render child folders first (sorted alphabetically)
    var folderNames = Object.keys(node.children).sort(function(a, b) {
      return a.localeCompare(b);
    });

    folderNames.forEach(function(folderName) {
      var childNode = node.children[folderName];
      var totalCount = countArticles(childNode);
      if (totalCount === 0) return; // skip empty folders

      var li = document.createElement('li');
      li.className = 'folder-tree-folder';

      var isExpanded = depth === 0; // first level expanded by default

      var header = document.createElement('div');
      header.className = 'folder-tree-header' + (isExpanded ? ' expanded' : '');
      header.innerHTML =
        '<span class="folder-tree-chevron">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</span>' +
        '<span class="folder-tree-icon">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' +
        '</span>' +
        '<span class="folder-tree-name">' + folderName + '</span>' +
        '<span class="folder-tree-count">' + totalCount + '</span>';

      header.addEventListener('click', function() {
        var isNowExpanded = header.classList.toggle('expanded');
        var childUl = li.querySelector('.folder-tree-level');
        if (childUl) {
          childUl.style.display = isNowExpanded ? '' : 'none';
        }
      });

      li.appendChild(header);

      var childTree = renderTree(childNode, depth + 1);
      if (!isExpanded) {
        childTree.style.display = 'none';
      }
      li.appendChild(childTree);

      ul.appendChild(li);
    });

    // Render articles in this folder (sorted by date descending)
    var sortedArticles = node.articles.slice().sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    sortedArticles.forEach(function(article) {
      var li = document.createElement('li');
      li.className = 'folder-tree-article';
      li.innerHTML =
        '<span class="folder-tree-icon">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' +
        '</span>' +
        '<a href="' + article.slug + '.html" class="folder-tree-link">' + article.title + '</a>';
      ul.appendChild(li);
    });

    return ul;
  }

  /**
   * Initialize the folder view
   * Called by articles-filters.js when needed
   */
  function initFolderView(articles, container) {
    if (!container || !articles || articles.length === 0) return;

    container.innerHTML = '';
    var tree = buildFolderTree(articles);

    // If root has no folders and only articles, render directly
    var rootTree = renderTree(tree, 0);
    rootTree.className += ' folder-tree-root';
    container.appendChild(rootTree);
  }

  // Expose to global scope for articles-filters.js to call
  window.initFolderView = initFolderView;
})();
