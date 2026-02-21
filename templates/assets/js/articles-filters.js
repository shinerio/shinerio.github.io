// Articles page filtering, sorting, and pagination functionality
document.addEventListener('DOMContentLoaded', function() {
  // Retrieve article data from the hidden script element
  const articleDataElement = document.getElementById('article-data');
  let articles = [];

  if (articleDataElement) {
    try {
      articles = JSON.parse(articleDataElement.textContent);
    } catch (e) {
      console.error('Failed to parse article data:', e);
      return;
    }
  } else {
    // Fallback: extract data from the DOM if JSON isn't available
    const articleItems = document.querySelectorAll('.article-item');
    articles = Array.from(articleItems).map(item => {
      // Extract data from DOM elements
      const titleEl = item.querySelector('h3 a');
      const dateEl = item.querySelector('time');
      const tagsEl = item.querySelector('.tags');
      const readingTimeEl = item.querySelector('.reading-time');

      return {
        id: item.getAttribute('data-id') || titleEl.textContent,
        title: titleEl.textContent,
        date: new Date(dateEl.dateTime),
        tags: tagsEl ? Array.from(tagsEl.querySelectorAll('.tag')).map(t => t.textContent.replace('#', '')) : [],
        readingTime: parseInt(readingTimeEl?.textContent || '0'),
        elementId: item.id || item.getAttribute('data-id'),
        domElement: item
      };
    });
  }

  // Sort options mapping
  const sortFunctions = {
    'date-desc': (a, b) => new Date(b.date) - new Date(a.date),
    'date-asc': (a, b) => new Date(a.date) - new Date(b.date),
    'modified-desc': (a, b) => new Date(b.modifiedDate || b.date) - new Date(a.modifiedDate || a.date),
    'title-asc': (a, b) => a.title.localeCompare(b.title),
    'title-desc': (a, b) => b.title.localeCompare(a.title),
    'readtime-asc': (a, b) => (a.readingTime || 0) - (b.readingTime || 0),
    'readtime-desc': (a, b) => (b.readingTime || 0) - (a.readingTime || 0)
  };

  // Get DOM elements with safety checks
  const sortSelect = document.getElementById('sort-select');
  const tagFilter = document.getElementById('tag-filter');
  const articleContainer = document.querySelector('.article-list');
  const filtersContainer = document.querySelector('.articles-filters');

  // If critical elements are missing, exit gracefully
  if (!sortSelect || !tagFilter || !articleContainer) {
    console.warn('Missing required DOM elements for articles filtering. Make sure the page includes sort-select, tag-filter, and article-list elements.');
    return;
  }

  // Read per-page config from data attribute, default to 10
  const perPage = parseInt(articleContainer.getAttribute('data-per-page'), 10) || 10;

  // Add container for active filters display
  if (filtersContainer) {
    const activeFiltersDiv = document.createElement('div');
    activeFiltersDiv.className = 'active-filters';
    activeFiltersDiv.id = 'active-filters';
    filtersContainer.insertBefore(activeFiltersDiv, filtersContainer.firstChild);
  }

  // Initialize articles container with data-id attributes for easier manipulation
  if (articleContainer) {
    const articleItems = articleContainer.querySelectorAll('.article-item');
    articleItems.forEach((item, index) => {
      if (!item.id && !item.getAttribute('data-id')) {
        const articleId = articles[index] ? articles[index].id : `article-${index}`;
        item.setAttribute('data-id', articleId);
      }
    });
  }

  // View toggle elements
  const folderContainer = document.querySelector('.folder-tree-container');
  const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
  const filterGroups = filtersContainer ? filtersContainer.querySelectorAll('.filter-group') : [];
  let folderViewInitialized = false;

  // Read tag from URL query parameter (e.g. articles.html?tag=network)
  const urlParams = new URLSearchParams(window.location.search);
  const urlTag = urlParams.get('tag');
  if (urlTag && tagFilter) {
    tagFilter.value = urlTag;
  }

  // Read view from URL query parameter (e.g. articles.html?view=folder)
  const urlView = urlParams.get('view');
  let currentView = (urlView === 'folder') ? 'folder' : 'list';

  // Read initial page from URL hash (e.g. #page=3)
  function getPageFromHash() {
    const match = window.location.hash.match(/^#page=(\d+)$/);
    return match ? parseInt(match[1], 10) : 1;
  }

  // Current filter state - initialize with default values if elements don't exist
  let currentState = {
    sortBy: sortSelect && sortSelect.value ? sortSelect.value : 'date-desc',
    filterByTag: tagFilter && tagFilter.value ? tagFilter.value : '',
    currentPage: getPageFromHash(),
    perPage: perPage
  };

  // Paginate articles: clamp page and return slice for current page
  function paginateArticles(filteredArticles) {
    var totalPages = Math.max(1, Math.ceil(filteredArticles.length / currentState.perPage));
    // Clamp current page to valid range
    if (currentState.currentPage < 1) currentState.currentPage = 1;
    if (currentState.currentPage > totalPages) currentState.currentPage = totalPages;

    var start = (currentState.currentPage - 1) * currentState.perPage;
    var end = start + currentState.perPage;
    return {
      pageArticles: filteredArticles.slice(start, end),
      totalItems: filteredArticles.length,
      totalPages: totalPages
    };
  }

  // Apply filters, sorting, and pagination
  function applyFilters() {
    if (!articleContainer) return;

    // Update current state with current values from DOM elements
    if (sortSelect) currentState.sortBy = sortSelect.value;
    if (tagFilter) currentState.filterByTag = tagFilter.value;

    // Update active filters display
    updateActiveFiltersDisplay();

    // Filter articles
    let filteredArticles = [...articles];

    if (currentState.filterByTag && currentState.filterByTag !== '') {
      filteredArticles = filteredArticles.filter(article =>
        article.tags && article.tags.includes(currentState.filterByTag)
      );
    }

    // Sort articles
    if (currentState.sortBy && sortFunctions[currentState.sortBy]) {
      filteredArticles.sort(sortFunctions[currentState.sortBy]);
    }

    // Paginate
    var paginationResult = paginateArticles(filteredArticles);

    // Update the DOM to reflect filtering, sorting, and pagination
    updateArticleDisplay(paginationResult.pageArticles);

    // Render pagination controls
    renderPaginationControls(paginationResult.totalItems, currentState.currentPage, currentState.perPage);

    // Update URL hash
    updateHash();
  }

  // Update URL hash with current page
  function updateHash() {
    if (currentState.currentPage <= 1) {
      // Clean URL for page 1
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      var newHash = '#page=' + currentState.currentPage;
      if (window.location.hash !== newHash) {
        history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
      }
    }
  }

  // Render pagination controls below the article list
  function renderPaginationControls(totalItems, currentPage, itemsPerPage) {
    var totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    // Remove existing pagination
    var existingPagination = document.querySelector('.pagination');
    if (existingPagination) {
      existingPagination.remove();
    }

    // Hide controls when only 1 page
    if (totalPages <= 1) return;

    var paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination';

    // Previous button
    var prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn pagination-prev';
    prevBtn.textContent = '« 上一页';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.addEventListener('click', function() {
      if (currentState.currentPage > 1) {
        currentState.currentPage--;
        applyFilters();
      }
    });
    paginationDiv.appendChild(prevBtn);

    // Page numbers with ellipsis
    var pageNumbers = getPageNumbers(currentPage, totalPages);
    pageNumbers.forEach(function(item) {
      if (item === '...') {
        var ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        paginationDiv.appendChild(ellipsis);
      } else {
        var pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-btn pagination-number' + (item === currentPage ? ' active' : '');
        pageBtn.textContent = item;
        pageBtn.addEventListener('click', (function(page) {
          return function() {
            currentState.currentPage = page;
            applyFilters();
          };
        })(item));
        paginationDiv.appendChild(pageBtn);
      }
    });

    // Next button
    var nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn pagination-next';
    nextBtn.textContent = '下一页 »';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.addEventListener('click', function() {
      if (currentState.currentPage < totalPages) {
        currentState.currentPage++;
        applyFilters();
      }
    });
    paginationDiv.appendChild(nextBtn);

    // Insert after article list
    articleContainer.parentNode.insertBefore(paginationDiv, articleContainer.nextSibling);
  }

  // Generate page number array with ellipsis
  // Shows at most 5 numbers around current page, with ellipsis for gaps when total > 7
  function getPageNumbers(current, total) {
    if (total <= 7) {
      // Show all pages
      var pages = [];
      for (var i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    var pages = [];
    // Always show first page
    pages.push(1);

    var rangeStart = Math.max(2, current - 2);
    var rangeEnd = Math.min(total - 1, current + 2);

    // Adjust range to always show 5 numbers in the middle when possible
    if (rangeEnd - rangeStart < 4) {
      if (rangeStart === 2) {
        rangeEnd = Math.min(total - 1, rangeStart + 4);
      } else if (rangeEnd === total - 1) {
        rangeStart = Math.max(2, rangeEnd - 4);
      }
    }

    // Left ellipsis
    if (rangeStart > 2) {
      pages.push('...');
    }

    // Middle pages
    for (var i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Right ellipsis
    if (rangeEnd < total - 1) {
      pages.push('...');
    }

    // Always show last page
    pages.push(total);

    return pages;
  }

  // Update the display of active filters
  function updateActiveFiltersDisplay() {
    const activeFiltersContainer = document.getElementById('active-filters');
    if (!activeFiltersContainer) return;

    // Clear current active filters display
    activeFiltersContainer.innerHTML = '';

    // Show tag filter if active
    if (currentState.filterByTag) {
      const tagFilterChip = document.createElement('div');
      tagFilterChip.className = 'filter-chip';
      tagFilterChip.innerHTML = `
        <span>标签: ${currentState.filterByTag}</span>
        <span class="remove-filter" onclick="clearTagFilter()">×</span>
      `;
      activeFiltersContainer.appendChild(tagFilterChip);
    }

    // Show sort method if not default
    if (currentState.sortBy !== 'date-desc') {
      const sortOptions = {
        'date-asc': '最早发布',
        'modified-desc': '最近修改',
        'title-asc': '标题 A-Z',
        'title-desc': '标题 Z-A',
        'readtime-asc': '阅读时间 (短至长)',
        'readtime-desc': '阅读时间 (长至短)'
      };

      const sortFilterChip = document.createElement('div');
      sortFilterChip.className = 'filter-chip';
      sortFilterChip.innerHTML = `
        <span>排序: ${sortOptions[currentState.sortBy]}</span>
        <span class="remove-filter" onclick="clearSortFilter()">×</span>
      `;
      activeFiltersContainer.appendChild(sortFilterChip);
    }

    // Show "clear all" button if any filters are active
    if (currentState.filterByTag || currentState.sortBy !== 'date-desc') {
      const clearAllButton = document.createElement('button');
      clearAllButton.className = 'filter-chip';
      clearAllButton.style.background = '#94a3b8';
      clearAllButton.textContent = '清除所有筛选';
      clearAllButton.onclick = clearAllFilters;
      activeFiltersContainer.appendChild(clearAllButton);
    }
  }

  // Function to clear tag filter
  window.clearTagFilter = function() {
    if (tagFilter) {
      tagFilter.value = '';
      currentState.filterByTag = '';
      currentState.currentPage = 1;
      applyFilters();
    }
  };

  // Function to clear sort filter (reset to default)
  window.clearSortFilter = function() {
    if (sortSelect) {
      sortSelect.value = 'date-desc';
      currentState.sortBy = 'date-desc';
      currentState.currentPage = 1;
      applyFilters();
    }
  };

  // Function to clear all filters
  window.clearAllFilters = function() {
    if (sortSelect) {
      sortSelect.value = 'date-desc';
      currentState.sortBy = 'date-desc';
    }
    if (tagFilter) {
      tagFilter.value = '';
      currentState.filterByTag = '';
    }
    currentState.currentPage = 1;
    applyFilters();
  };

  // Update the display to show filtered/sorted articles
  function updateArticleDisplay(sortedFilteredArticles) {
    if (!articleContainer) return;

    // Clear current display (but keep the container)
    articleContainer.innerHTML = '';

    if (sortedFilteredArticles.length === 0) {
      // Show no results message
      articleContainer.innerHTML = '<div class="no-results">没有找到符合条件的文章</div>';
      return;
    }

    // Rebuild the article list in the correct order
    sortedFilteredArticles.forEach(article => {
      // If we can't find the element, reconstruct it from the data
      var articleElement = document.createElement('div');
      articleElement.className = 'article-item';
      articleElement.setAttribute('data-id', article.id);

      articleElement.innerHTML = `
        <h3>
          <a href="${article.slug}.html">${article.title}</a>
          <a href="assets/markdown/${article.slug}.md"
             download="${article.title}.md"
             class="markdown-export-btn"
             title="下载 Markdown 源文件"
             aria-label="导出 Markdown"
             onclick="event.stopPropagation()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </a>
        </h3>
        <p class="article-excerpt">${article.description || ''}</p>
        <div class="article-meta">
          <time datetime="${new Date(article.date).toISOString()}">${formatDate(new Date(article.date))}</time>
          <span class="reading-time">${article.readingTime || 0} 分钟阅读</span>
          ${article.tags && article.tags.length > 0 ?
            `<div class="tags">${article.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` :
            ''}
        </div>
      `;

      articleContainer.appendChild(articleElement);
    });
  }

  // Helper function to format dates
  function formatDate(date) {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Attach event listeners for filters - reset page to 1 on filter/sort change
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      currentState.currentPage = 1;
      applyFilters();
    });
  }

  if (tagFilter) {
    tagFilter.addEventListener('change', function() {
      currentState.currentPage = 1;
      applyFilters();
    });
  }

  // Listen for hashchange to handle browser back/forward
  window.addEventListener('hashchange', function() {
    var newPage = getPageFromHash();
    if (newPage !== currentState.currentPage) {
      currentState.currentPage = newPage;
      applyFilters();
    }
  });

  // --- View toggle logic ---

  function switchView(view) {
    currentView = view;

    // Update toggle button active states
    viewToggleBtns.forEach(function(btn) {
      if (btn.getAttribute('data-view') === view) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (view === 'folder') {
      // Hide list view elements
      if (articleContainer) articleContainer.style.display = 'none';
      var pagination = document.querySelector('.pagination');
      if (pagination) pagination.style.display = 'none';
      filterGroups.forEach(function(g) { g.style.display = 'none'; });
      var activeFilters = document.getElementById('active-filters');
      if (activeFilters) activeFilters.style.display = 'none';

      // Show folder view
      if (folderContainer) {
        folderContainer.style.display = '';
        if (!folderViewInitialized && typeof window.initFolderView === 'function') {
          window.initFolderView(articles, folderContainer);
          folderViewInitialized = true;
        }
      }
    } else {
      // Show list view elements
      if (articleContainer) articleContainer.style.display = '';
      var pagination = document.querySelector('.pagination');
      if (pagination) pagination.style.display = '';
      filterGroups.forEach(function(g) { g.style.display = ''; });
      var activeFilters = document.getElementById('active-filters');
      if (activeFilters) activeFilters.style.display = '';

      // Hide folder view
      if (folderContainer) folderContainer.style.display = 'none';
    }

    // Update URL
    updateViewUrl(view);
  }

  function updateViewUrl(view) {
    var params = new URLSearchParams(window.location.search);
    if (view === 'folder') {
      params.set('view', 'folder');
    } else {
      params.delete('view');
    }
    var newSearch = params.toString();
    var newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    history.replaceState(null, '', newUrl);
  }

  // Attach click listeners to view toggle buttons
  viewToggleBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var view = btn.getAttribute('data-view');
      if (view !== currentView) {
        switchView(view);
      }
    });
  });

  // Initial application of filters
  applyFilters();

  // Apply initial view (after applyFilters so list is rendered)
  if (currentView === 'folder') {
    switchView('folder');
  }
});
