// Articles page filtering and sorting functionality
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

  // Current filter state - initialize with default values if elements don't exist
  let currentState = {
    sortBy: sortSelect && sortSelect.value ? sortSelect.value : 'date-desc',
    filterByTag: tagFilter && tagFilter.value ? tagFilter.value : ''
  };

  // Apply filters and sorting
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

    // Update the DOM to reflect filtering and sorting
    updateArticleDisplay(filteredArticles);
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
      applyFilters();
    }
  };

  // Function to clear sort filter (reset to default)
  window.clearSortFilter = function() {
    if (sortSelect) {
      sortSelect.value = 'date-desc';
      currentState.sortBy = 'date-desc';
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
      // Find the corresponding DOM element
      let articleElement = document.querySelector(`[data-id="${article.id}"]`);

      if (!articleElement) {
        // If we can't find the element, reconstruct it from the data
        articleElement = document.createElement('div');
        articleElement.className = 'article-item';
        articleElement.setAttribute('data-id', article.id);

        articleElement.innerHTML = `
          <h3><a href="${article.slug}.html">${article.title}</a></h3>
          <p class="article-excerpt">${article.description || ''}</p>
          <div class="article-meta">
            <time datetime="${new Date(article.date).toISOString()}">${formatDate(new Date(article.date))}</time>
            <span class="reading-time">${article.readingTime || 0} 分钟阅读</span>
            ${article.tags && article.tags.length > 0 ?
              `<div class="tags">${article.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` :
              ''}
          </div>
        `;
      }

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

  // Attach event listeners
  if (sortSelect) {
    sortSelect.addEventListener('change', applyFilters);
  }

  if (tagFilter) {
    tagFilter.addEventListener('change', applyFilters);
  }

  // Initial application of filters
  applyFilters();
});