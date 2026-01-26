/**
 * Main JavaScript file for Obsidian Blog Generator
 * Handles navigation, search, and interactive features
 */

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeSearch();
    initializeArticleFeatures();
    initializeTheme();
});

/**
 * Initialize navigation functionality
 */
function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    
    if (navToggle && nav) {
        navToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            
            // Animate hamburger menu
            const spans = navToggle.querySelectorAll('span');
            spans.forEach((span, index) => {
                if (nav.classList.contains('active')) {
                    if (index === 0) span.style.transform = 'rotate(45deg) translate(5px, 5px)';
                    if (index === 1) span.style.opacity = '0';
                    if (index === 2) span.style.transform = 'rotate(-45deg) translate(7px, -6px)';
                } else {
                    span.style.transform = '';
                    span.style.opacity = '';
                }
            });
        });
        
        // Close nav when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !nav.contains(e.target)) {
                nav.classList.remove('active');
                const spans = navToggle.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.transform = '';
                    span.style.opacity = '';
                });
            }
        });
    }
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchResults = document.getElementById('search-results');
    const resultsStatus = document.getElementById('search-status');
    const resultsList = document.getElementById('results-list');
    
    if (!searchInput) return;
    
    let searchData = [];
    let searchTimeout;
    
    // Load search data
    loadSearchData().then(data => {
        searchData = data;
    });
    
    // Search input handler
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length === 0) {
            searchClear.style.display = 'none';
            resultsStatus.innerHTML = '<p>输入关键词开始搜索</p>';
            resultsList.innerHTML = '';
            return;
        }
        
        searchClear.style.display = 'block';
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    // Clear search
    if (searchClear) {
        searchClear.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.focus();
            this.style.display = 'none';
            resultsStatus.innerHTML = '<p>输入关键词开始搜索</p>';
            resultsList.innerHTML = '';
        });
    }
    
    // Search filters
    const searchFilters = document.querySelectorAll('.filter-checkbox input');
    searchFilters.forEach(filter => {
        filter.addEventListener('change', function() {
            if (searchInput.value.trim()) {
                performSearch(searchInput.value.trim());
            }
        });
    });
    
    /**
     * Load search data from JSON file
     */
    async function loadSearchData() {
        try {
            const response = await fetch('assets/data/search.json');
            return await response.json();
        } catch (error) {
            console.error('Failed to load search data:', error);
            return [];
        }
    }
    
    /**
     * Perform search with given query
     */
    function performSearch(query) {
        if (!searchData.length) {
            resultsStatus.innerHTML = '<p>搜索数据加载中...</p>';
            return;
        }
        
        const searchTitle = document.getElementById('search-title').checked;
        const searchContent = document.getElementById('search-content').checked;
        const searchTags = document.getElementById('search-tags').checked;
        
        const results = searchData.filter(article => {
            const queryLower = query.toLowerCase();
            let matches = false;
            
            if (searchTitle && article.title.toLowerCase().includes(queryLower)) {
                matches = true;
            }
            
            if (searchContent && article.content.toLowerCase().includes(queryLower)) {
                matches = true;
            }
            
            if (searchTags && article.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
                matches = true;
            }
            
            return matches;
        });
        
        displaySearchResults(results, query);
    }
    
    /**
     * Display search results
     */
    function displaySearchResults(results, query) {
        if (results.length === 0) {
            resultsStatus.innerHTML = '<p>未找到相关文章</p>';
            resultsList.innerHTML = '';
            return;
        }
        
        resultsStatus.innerHTML = `<p>找到 ${results.length} 篇相关文章</p>`;
        
        const resultsHTML = results.map(article => {
            const highlightedTitle = highlightText(article.title, query);
            const highlightedExcerpt = highlightText(article.excerpt, query);
            
            return `
                <div class="search-result">
                    <h3><a href="${article.slug}.html">${highlightedTitle}</a></h3>
                    <p class="result-excerpt">${highlightedExcerpt}</p>
                    <div class="result-meta">
                        <time>${formatDate(article.date)}</time>
                        ${article.tags.length > 0 ? `<div class="result-tags">${article.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        resultsList.innerHTML = resultsHTML;
    }
    
    /**
     * Highlight search terms in text
     */
    function highlightText(text, query) {
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    /**
     * Escape special regex characters
     */
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

/**
 * Initialize article-specific features
 */
function initializeArticleFeatures() {
    initializeTableOfContents();
    initializeCodeCopy();
    initializeImageLightbox();
    initializeShareButtons();
}

/**
 * Generate and initialize table of contents
 */
function initializeTableOfContents() {
    const tocContainer = document.getElementById('table-of-contents');
    const articleContent = document.querySelector('.article-content');
    
    if (!tocContainer || !articleContent) return;
    
    const headings = articleContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
        tocContainer.innerHTML = '<p>本文无目录</p>';
        return;
    }
    
    let tocHTML = '<ul class="toc-list">';
    
    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        
        const level = parseInt(heading.tagName.charAt(1));
        const indent = level > 2 ? ' style="margin-left: ' + ((level - 2) * 1) + 'rem"' : '';
        
        tocHTML += `<li${indent}><a href="#${id}" class="toc-link">${heading.textContent}</a></li>`;
    });
    
    tocHTML += '</ul>';
    tocContainer.innerHTML = tocHTML;
    
    // Smooth scroll for TOC links
    const tocLinks = tocContainer.querySelectorAll('.toc-link');
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Add copy buttons to code blocks
 */
function initializeCodeCopy() {
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.innerHTML = '复制';
        copyButton.setAttribute('aria-label', '复制代码');
        
        pre.style.position = 'relative';
        pre.appendChild(copyButton);
        
        copyButton.addEventListener('click', async function() {
            try {
                await navigator.clipboard.writeText(codeBlock.textContent);
                this.innerHTML = '已复制!';
                setTimeout(() => {
                    this.innerHTML = '复制';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
                this.innerHTML = '复制失败';
                setTimeout(() => {
                    this.innerHTML = '复制';
                }, 2000);
            }
        });
    });
}

/**
 * Initialize image lightbox
 */
function initializeImageLightbox() {
    const images = document.querySelectorAll('.article-content img');
    
    images.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function() {
            openLightbox(this.src, this.alt);
        });
    });
    
    function openLightbox(src, alt) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <img src="${src}" alt="${alt}">
                <button class="lightbox-close" aria-label="关闭">&times;</button>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';
        
        // Close lightbox
        const closeBtn = lightbox.querySelector('.lightbox-close');
        closeBtn.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeLightbox();
            }
        });
        
        function closeLightbox() {
            document.body.removeChild(lightbox);
            document.body.style.overflow = '';
        }
    }
}

/**
 * Initialize share buttons
 */
function initializeShareButtons() {
    const shareBtn = document.querySelector('.action-btn[onclick="shareArticle()"]');
    
    if (shareBtn) {
        shareBtn.removeAttribute('onclick');
        shareBtn.addEventListener('click', function() {
            if (navigator.share) {
                navigator.share({
                    title: document.title,
                    url: window.location.href
                });
            } else {
                // Fallback: copy URL to clipboard
                navigator.clipboard.writeText(window.location.href).then(() => {
                    alert('文章链接已复制到剪贴板');
                });
            }
        });
    }
}

/**
 * Initialize theme functionality
 */
function initializeTheme() {
    // Auto theme detection
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-theme');
    }
    
    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (e.matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    });
}

/**
 * Utility function to format dates
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Article filters functionality
 */
function initializeArticleFilters() {
    const sortSelect = document.getElementById('sort-select');
    const tagFilter = document.getElementById('tag-filter');
    const articleItems = document.querySelectorAll('.article-item');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortArticles(this.value);
        });
    }
    
    if (tagFilter) {
        tagFilter.addEventListener('change', function() {
            filterByTag(this.value);
        });
    }
    
    function sortArticles(sortBy) {
        const container = document.querySelector('.article-list');
        const articles = Array.from(articleItems);
        
        articles.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.dataset.date) - new Date(a.dataset.date);
                case 'date-asc':
                    return new Date(a.dataset.date) - new Date(b.dataset.date);
                case 'title-asc':
                    return a.dataset.title.localeCompare(b.dataset.title);
                case 'title-desc':
                    return b.dataset.title.localeCompare(a.dataset.title);
                default:
                    return 0;
            }
        });
        
        articles.forEach(article => container.appendChild(article));
    }
    
    function filterByTag(tag) {
        articleItems.forEach(item => {
            if (!tag || item.dataset.tags.includes(tag)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// Initialize article filters if on articles page
if (document.querySelector('.article-list')) {
    document.addEventListener('DOMContentLoaded', initializeArticleFilters);
}