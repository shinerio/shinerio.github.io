/**
 * Text Selection Comment Module
 * 划词评论模块
 *
 * Features:
 * - Text selection detection
 * - Comment toolbar on selection
 * - Comment popover with form
 * - GitHub API integration for storing/loading comments
 * - Text highlighting based on saved comments
 * - Hover tooltip to show comments
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // Will be populated from window.textSelectionCommentConfig
    repo: null,
    label: 'text-annotation',
    // DOM selectors
    contentSelector: '.content',
    // Text matching
    contextLength: 30,
    // Storage keys
    tokenKey: 'tsc_github_token',
    userKey: 'tsc_github_user',
  };

  // State
  const state = {
    isInitialized: false,
    isAuthenticated: false,
    currentUser: null,
    token: null,
    comments: [],
    unmatchedComments: [],
    currentSelection: null,
    toolbar: null,
    popover: null,
    tooltip: null,
    articleSlug: null,
    deviceModal: null,
    devicePollTimer: null,
    tooltipHideTimer: null,
  };

  // Icons (SVG)
  const ICONS = {
    comment: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    github: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    delete: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
  };

  /**
   * Initialize the module
   */
  function init() {
    if (state.isInitialized) return;

    // Read configuration from page
    const pageConfig = window.textSelectionCommentConfig || {};
    CONFIG.repo = pageConfig.repo || CONFIG.repo;
    CONFIG.label = pageConfig.label || CONFIG.label;
    CONFIG.clientId = pageConfig.clientId || '';
    CONFIG.oauthProxyUrl = pageConfig.oauthProxyUrl || '';
    state.articleSlug = pageConfig.articleSlug || getArticleSlug();

    if (!CONFIG.repo) {
      console.warn('[TSC] No GitHub repo configured, text selection comments disabled');
      return;
    }

    // Check for stored auth token
    loadAuthState();

    // Create UI elements
    createToolbar();
    createPopover();
    createTooltip();

    // Bind events
    bindEvents();

    // Load existing comments
    loadComments();

    state.isInitialized = true;
    console.log('[TSC] Text selection comments initialized');
  }

  /**
   * Get article slug from URL
   */
  function getArticleSlug() {
    const path = window.location.pathname;
    const match = path.match(/\/([^/]+)\.html?$/);
    return match ? match[1] : path.replace(/\//g, '-').replace(/^-|-$/g, '') || 'article';
  }

  /**
   * Load authentication state from storage
   */
  function loadAuthState() {
    try {
      state.token = localStorage.getItem(CONFIG.tokenKey);
      const userData = localStorage.getItem(CONFIG.userKey);
      if (userData) {
        state.currentUser = JSON.parse(userData);
        state.isAuthenticated = true;
      }
    } catch (e) {
      console.warn('[TSC] Failed to load auth state:', e);
    }
  }

  /**
   * Save authentication state to storage
   */
  function saveAuthState(token, user) {
    try {
      localStorage.setItem(CONFIG.tokenKey, token);
      localStorage.setItem(CONFIG.userKey, JSON.stringify(user));
      state.token = token;
      state.currentUser = user;
      state.isAuthenticated = true;
    } catch (e) {
      console.error('[TSC] Failed to save auth state:', e);
    }
  }

  /**
   * Clear authentication state
   */
  function clearAuthState() {
    try {
      localStorage.removeItem(CONFIG.tokenKey);
      localStorage.removeItem(CONFIG.userKey);
      state.token = null;
      state.currentUser = null;
      state.isAuthenticated = false;
    } catch (e) {
      console.error('[TSC] Failed to clear auth state:', e);
    }
  }

  /**
   * Create the floating toolbar
   */
  function createToolbar() {
    state.toolbar = document.createElement('div');
    state.toolbar.className = 'tsc-toolbar';
    state.toolbar.innerHTML = `
      <button class="tsc-toolbar-btn tsc-toolbar-comment" title="添加评论">
        ${ICONS.comment}
      </button>
    `;
    document.body.appendChild(state.toolbar);

    // Bind comment button click
    const commentBtn = state.toolbar.querySelector('.tsc-toolbar-comment');
    commentBtn.addEventListener('click', handleCommentClick);
  }

  /**
   * Create the comment popover
   */
  function createPopover() {
    state.popover = document.createElement('div');
    state.popover.className = 'tsc-popover';
    document.body.appendChild(state.popover);
  }

  /**
   * Create the tooltip element
   */
  function createTooltip() {
    state.tooltip = document.createElement('div');
    state.tooltip.className = 'tsc-tooltip';
    document.body.appendChild(state.tooltip);

    // Keep tooltip visible when mouse enters it (for clicking the GitHub link)
    state.tooltip.addEventListener('mouseenter', () => {
      clearTimeout(state.tooltipHideTimer);
    });
    state.tooltip.addEventListener('mouseleave', () => {
      state.tooltip.classList.remove('visible');
    });
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Text selection detection
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    // Close popover on outside click
    document.addEventListener('click', handleDocumentClick);

    // Escape key handling
    document.addEventListener('keydown', handleKeyDown);

    // Theme change detection
    window.addEventListener('themechange', handleThemeChange);
  }

  /**
   * Handle mouse up event
   */
  function handleMouseUp(e) {
    // Small delay to allow selection to be finalized
    setTimeout(() => {
      checkSelection();
    }, 10);
  }

  /**
   * Handle selection change event
   */
  function handleSelectionChange() {
    // Debounced selection check
    clearTimeout(state.selectionTimer);
    state.selectionTimer = setTimeout(() => {
      checkSelection();
    }, 100);
  }

  /**
   * Check current text selection and show/hide toolbar
   */
  function checkSelection() {
    // Don't clear selection while popover or device modal is visible (user is interacting with them)
    const popoverVisible = state.popover && state.popover.classList.contains('visible');
    const deviceModalVisible = state.deviceModal && state.deviceModal.classList.contains('visible');

    const selection = window.getSelection();
    const text = selection.toString().trim();

    // Check if we have a valid selection within content
    const contentEl = document.querySelector(CONFIG.contentSelector);
    if (!contentEl || text.length === 0) {
      hideToolbar();
      if (!popoverVisible && !deviceModalVisible) {
        state.currentSelection = null;
      }
      return;
    }

    // Check if selection is actually within content element
    const range = selection.getRangeAt(0);
    if (!contentEl.contains(range.commonAncestorContainer)) {
      hideToolbar();
      if (!popoverVisible && !deviceModalVisible) {
        state.currentSelection = null;
      }
      return;
    }

    // Store selection info
    state.currentSelection = {
      text: text,
      range: range.cloneRange(),
      rect: range.getBoundingClientRect(),
    };

    // Show toolbar
    showToolbar();
  }

  /**
   * Show the floating toolbar
   */
  function showToolbar() {
    if (!state.currentSelection || !state.toolbar) return;

    const rect = state.currentSelection.rect;
    const toolbarWidth = state.toolbar.offsetWidth || 44;
    const toolbarHeight = state.toolbar.offsetHeight || 44;

    // Position above the selection
    let left = rect.left + rect.width / 2 - toolbarWidth / 2;
    let top = rect.top - toolbarHeight - 10;

    // Ensure it stays within viewport
    const viewportWidth = window.innerWidth;
    if (left < 10) left = 10;
    if (left + toolbarWidth > viewportWidth - 10) {
      left = viewportWidth - toolbarWidth - 10;
    }
    if (top < 10) {
      top = rect.bottom + 10;
    }

    state.toolbar.style.left = `${left}px`;
    state.toolbar.style.top = `${top + window.scrollY}px`;
    state.toolbar.classList.add('visible');
  }

  /**
   * Hide the floating toolbar
   */
  function hideToolbar() {
    if (state.toolbar) {
      state.toolbar.classList.remove('visible');
    }
  }

  /**
   * Handle comment button click
   */
  function handleCommentClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!state.isAuthenticated) {
      showAuthPrompt();
    } else {
      showCommentPopover();
    }

    hideToolbar();
  }

  /**
   * Show authentication prompt in popover
   */
  function showAuthPrompt() {
    const rect = state.currentSelection ? state.currentSelection.rect : null;

    state.popover.innerHTML = `
      <div class="tsc-popover-header">
        <span class="tsc-popover-title">登录以添加评论</span>
        <button class="tsc-popover-close" title="关闭">${ICONS.close}</button>
      </div>
      <div class="tsc-auth-prompt">
        <p>使用 GitHub 账号登录后即可添加划词评论</p>
        <button class="tsc-auth-btn">
          ${ICONS.github}
          <span>使用 GitHub 登录</span>
        </button>
      </div>
    `;

    // Bind close button
    state.popover.querySelector('.tsc-popover-close').addEventListener('click', hidePopover);

    // Bind auth button
    state.popover.querySelector('.tsc-auth-btn').addEventListener('click', handleAuthClick);

    positionPopover(rect);
    state.popover.classList.add('visible');
  }

  /**
   * Handle GitHub auth click - starts Device Flow
   */
  function handleAuthClick() {
    hidePopover();
    startDeviceFlow();
  }

  /**
   * Create the device flow modal
   */
  function createDeviceModal() {
    if (state.deviceModal) return;

    state.deviceModal = document.createElement('div');
    state.deviceModal.className = 'tsc-device-modal';
    state.deviceModal.innerHTML = `
      <div class="tsc-device-modal-content">
        <div class="tsc-popover-header">
          <span class="tsc-popover-title">GitHub 授权</span>
          <button class="tsc-popover-close tsc-device-cancel" title="关闭">${ICONS.close}</button>
        </div>
        <div class="tsc-device-body">
          <p class="tsc-device-instruction">请访问以下链接并输入授权码：</p>
          <a class="tsc-device-link" href="https://github.com/login/device" target="_blank" rel="noopener noreferrer">github.com/login/device</a>
          <div class="tsc-device-code"></div>
          <button class="tsc-device-copy-btn">复制授权码</button>
          <p class="tsc-device-status">等待授权中...</p>
        </div>
      </div>
    `;
    document.body.appendChild(state.deviceModal);

    // Bind close/cancel
    state.deviceModal.querySelector('.tsc-device-cancel').addEventListener('click', cancelDeviceFlow);
    state.deviceModal.addEventListener('click', (e) => {
      if (e.target === state.deviceModal) cancelDeviceFlow();
    });

    // Bind copy button
    state.deviceModal.querySelector('.tsc-device-copy-btn').addEventListener('click', () => {
      const code = state.deviceModal.querySelector('.tsc-device-code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        const btn = state.deviceModal.querySelector('.tsc-device-copy-btn');
        btn.textContent = '已复制!';
        setTimeout(() => { btn.textContent = '复制授权码'; }, 2000);
      }).catch(() => {});
    });
  }

  /**
   * Start OAuth Device Flow
   */
  async function startDeviceFlow() {
    const clientId = CONFIG.clientId || '';
    const proxyUrl = CONFIG.oauthProxyUrl || '';

    if (!clientId || !proxyUrl) {
      console.error('[TSC] OAuth not configured: missing clientId or oauthProxyUrl');
      alert('OAuth 未配置，无法登录');
      return;
    }

    createDeviceModal();

    try {
      const resp = await fetch(proxyUrl + '/device/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          scope: 'public_repo'
        })
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('[TSC] Device flow error:', errorText);
        alert('启动授权失败，请重试');
        return;
      }

      const data = await resp.json();

      if (data.error) {
        console.error('[TSC] GitHub error:', data);
        alert('授权错误: ' + (data.error_description || data.error));
        return;
      }

      // Show modal with device code
      state.deviceModal.querySelector('.tsc-device-code').textContent = data.user_code;
      const linkEl = state.deviceModal.querySelector('.tsc-device-link');
      linkEl.href = data.verification_uri || 'https://github.com/login/device';
      state.deviceModal.querySelector('.tsc-device-status').textContent = '等待授权中...';
      state.deviceModal.classList.add('visible');

      // Start polling for token
      pollForToken(data.device_code, data.interval || 5);
    } catch (e) {
      console.error('[TSC] Device flow exception:', e);
      alert('授权请求失败: ' + e.message);
    }
  }

  /**
   * Poll for access token during Device Flow
   */
  function pollForToken(deviceCode, interval) {
    if (state.devicePollTimer) clearInterval(state.devicePollTimer);

    const clientId = CONFIG.clientId || '';
    const proxyUrl = CONFIG.oauthProxyUrl || '';

    state.devicePollTimer = setInterval(async () => {
      try {
        const resp = await fetch(proxyUrl + '/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          })
        });

        if (!resp.ok) return;

        const data = await resp.json();

        if (data.access_token) {
          clearInterval(state.devicePollTimer);
          state.devicePollTimer = null;

          // Fetch user info and save auth state
          try {
            const userResp = await fetch('https://api.github.com/user', {
              headers: { 'Authorization': 'token ' + data.access_token }
            });
            if (userResp.ok) {
              const user = await userResp.json();
              saveAuthState(data.access_token, {
                login: user.login,
                avatarUrl: user.avatar_url,
                id: user.id
              });
            } else {
              saveAuthState(data.access_token, null);
            }
          } catch (e) {
            saveAuthState(data.access_token, null);
          }

          // Hide modal
          state.deviceModal.classList.remove('visible');

          // If we had a pending selection, show the comment popover
          if (state.currentSelection) {
            showCommentPopover();
          }
        } else if (data.error === 'authorization_pending') {
          // Keep waiting
        } else if (data.error === 'slow_down') {
          state.deviceModal.querySelector('.tsc-device-status').textContent = '请稍候...';
        } else if (data.error === 'expired_token') {
          clearInterval(state.devicePollTimer);
          state.devicePollTimer = null;
          state.deviceModal.querySelector('.tsc-device-status').textContent = '授权码已过期，请重新操作';
        } else if (data.error === 'access_denied') {
          clearInterval(state.devicePollTimer);
          state.devicePollTimer = null;
          state.deviceModal.querySelector('.tsc-device-status').textContent = '授权被拒绝';
        }
      } catch (e) {
        console.error('[TSC] Token polling error:', e);
      }
    }, (interval + 1) * 1000);
  }

  /**
   * Cancel the device flow
   */
  function cancelDeviceFlow() {
    if (state.devicePollTimer) {
      clearInterval(state.devicePollTimer);
      state.devicePollTimer = null;
    }
    if (state.deviceModal) {
      state.deviceModal.classList.remove('visible');
    }
  }

  /**
   * Show comment input popover
   */
  function showCommentPopover() {
    // Save scroll position before any changes
    const scrollPos = {
      scrollX: window.scrollX || window.pageXOffset,
      scrollY: window.scrollY || window.pageYOffset
    };

    const rect = state.currentSelection ? state.currentSelection.rect : null;
    const selectedText = state.currentSelection ? state.currentSelection.text : '';

    state.popover.innerHTML = `
      <div class="tsc-popover-header">
        <span class="tsc-popover-title">添加评论</span>
        <button class="tsc-popover-close" title="关闭">${ICONS.close}</button>
      </div>
      <div class="tsc-popover-selected-text" style="margin-bottom: 12px; padding: 8px; background: var(--color-bg-secondary, #f6f8fa); border-radius: 6px; font-size: 13px; color: var(--color-text-secondary, #586069); font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        "${escapeHtml(selectedText)}"
      </div>
      <textarea class="tsc-popover-textarea" placeholder="写下你的评论..." rows="3"></textarea>
      <div class="tsc-popover-actions">
        <button class="tsc-btn tsc-btn-secondary tsc-btn-cancel">取消</button>
        <button class="tsc-btn tsc-btn-primary tsc-btn-submit">提交</button>
      </div>
    `;

    // Bind events
    state.popover.querySelector('.tsc-popover-close').addEventListener('click', hidePopover);
    state.popover.querySelector('.tsc-btn-cancel').addEventListener('click', hidePopover);
    state.popover.querySelector('.tsc-btn-submit').addEventListener('click', handleSubmitComment);

    positionPopover(rect);
    state.popover.classList.add('visible');

    const textarea = state.popover.querySelector('.tsc-popover-textarea');
    // Use preventScroll to avoid page jumping when focusing
    try {
      textarea.focus({ preventScroll: true });
    } catch (e) {
      // Fallback for older browsers
      textarea.focus();
    }
    // Restore scroll position as a safeguard
    window.scrollTo(scrollPos.scrollX, scrollPos.scrollY);

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmitComment();
      }
    });
  }

  /**
   * Position the popover
   */
  function positionPopover(rect) {
    // Make sure position is set to absolute before measuring
    state.popover.style.position = 'absolute';
    // Temporarily show with opacity 0 to get accurate dimensions
    const wasVisible = state.popover.classList.contains('visible');
    if (!wasVisible) {
      state.popover.style.opacity = '0';
      state.popover.style.pointerEvents = 'none';
      state.popover.classList.add('visible');
    }

    // Force a reflow to get accurate dimensions
    state.popover.offsetHeight;

    if (!rect) {
      // Center in viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popoverWidth = state.popover.offsetWidth || 320;
      const popoverHeight = state.popover.offsetHeight || 200;

      state.popover.style.left = `${(viewportWidth - popoverWidth) / 2}px`;
      state.popover.style.top = `${(viewportHeight - popoverHeight) / 2 + window.scrollY}px`;
    } else {
      const popoverWidth = state.popover.offsetWidth || 320;
      const popoverHeight = state.popover.offsetHeight || 200;

      // Position below selection by default
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      let top = rect.bottom + 10;

      // Ensure it stays within viewport
      const viewportWidth = window.innerWidth;
      if (left < 10) left = 10;
      if (left + popoverWidth > viewportWidth - 10) {
        left = viewportWidth - popoverWidth - 10;
      }

      // If it would go off the bottom, position above instead
      const viewportHeight = window.innerHeight;
      if (top + popoverHeight > window.scrollY + viewportHeight - 10) {
        top = rect.top - popoverHeight - 10;
      }

      state.popover.style.left = `${left}px`;
      state.popover.style.top = `${top + window.scrollY}px`;
    }

    // Restore visibility state if we temporarily modified it
    if (!wasVisible) {
      state.popover.classList.remove('visible');
      state.popover.style.opacity = '';
      state.popover.style.pointerEvents = '';
    }
  }

  /**
   * Hide the popover
   */
  function hidePopover() {
    if (state.popover) {
      state.popover.classList.remove('visible');
    }
  }

  /**
   * Handle comment submission
   */
  async function handleSubmitComment() {
    const textarea = state.popover.querySelector('.tsc-popover-textarea');
    const comment = textarea.value.trim();

    if (!comment) {
      textarea.focus();
      return;
    }

    if (!state.currentSelection) {
      hidePopover();
      return;
    }

    // Extract anchor data
    const anchorData = extractAnchorData(state.currentSelection);

    // Create comment data
    const commentData = {
      selectedText: anchorData.selectedText,
      prefix: anchorData.prefix,
      suffix: anchorData.suffix,
      paragraphIndex: anchorData.paragraphIndex,
      comment: comment,
      author: state.currentUser ? state.currentUser.login : null,
      createdAt: new Date().toISOString(),
    };

    try {
      // Submit to GitHub
      const ghComment = await submitCommentToGitHub(commentData);

      // Store GitHub comment metadata
      commentData._id = ghComment.id;
      commentData._url = ghComment.html_url;

      // Add to local state
      state.comments.push(commentData);

      // Render the highlight
      renderHighlight(commentData);

      // Hide popover
      hidePopover();

      // Clear selection
      window.getSelection().removeAllRanges();
      state.currentSelection = null;
    } catch (error) {
      console.error('[TSC] Failed to submit comment:', error);
      alert('提交评论失败，请重试');
    }
  }

  /**
   * Extract anchor data from selection
   */
  function extractAnchorData(selection) {
    const range = selection.range;
    const selectedText = selection.text;

    // Get context (prefix and suffix)
    const contextRange = document.createRange();
    const startNode = range.startContainer;

    // Get prefix (30 chars before)
    let prefix = '';
    try {
      const textContent = startNode.textContent || '';
      const startOffset = range.startOffset;
      const prefixStart = Math.max(0, startOffset - CONFIG.contextLength);
      prefix = textContent.substring(prefixStart, startOffset);
    } catch (e) {
      // Ignore
    }

    // Get suffix (30 chars after)
    let suffix = '';
    try {
      const endNode = range.endContainer;
      const textContent = endNode.textContent || '';
      const endOffset = range.endOffset;
      suffix = textContent.substring(endOffset, endOffset + CONFIG.contextLength);
    } catch (e) {
      // Ignore
    }

    // Get paragraph index
    const paragraphIndex = getParagraphIndex(range);

    return {
      selectedText,
      prefix: prefix.slice(-CONFIG.contextLength),
      suffix: suffix.slice(0, CONFIG.contextLength),
      paragraphIndex,
    };
  }

  /**
   * Get paragraph index of a range
   */
  function getParagraphIndex(range) {
    const contentEl = document.querySelector(CONFIG.contentSelector);
    if (!contentEl) return 0;

    const paragraphs = contentEl.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote');

    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    for (let i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i] === container || paragraphs[i].contains(container)) {
        return i;
      }
    }

    return 0;
  }

  /**
   * Submit comment to GitHub
   */
  async function submitCommentToGitHub(commentData) {
    const issueNumber = await getOrCreateAnnotationIssue();

    const response = await fetch(`https://api.github.com/repos/${CONFIG.repo}/issues/${issueNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${state.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: '```json\n' + JSON.stringify(commentData, null, 2) + '\n```',
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthState();
        throw new Error('Authentication expired');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get or create annotation issue
   */
  async function getOrCreateAnnotationIssue() {
    // Check cache first
    const cacheKey = `tsc_issue_${state.articleSlug}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      return parseInt(cached, 10);
    }

    const title = `[annotation] ${state.articleSlug}`;

    // Search for existing issue
    const searchResponse = await fetch(
      `https://api.github.com/repos/${CONFIG.repo}/issues?state=all&labels=${encodeURIComponent(CONFIG.label)}&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (searchResponse.ok) {
      const issues = await searchResponse.json();
      const existing = issues.find(issue => issue.title === title);
      if (existing) {
        sessionStorage.setItem(cacheKey, existing.number);
        return existing.number;
      }
    }

    // Create new issue
    const createResponse = await fetch(`https://api.github.com/repos/${CONFIG.repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${state.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        body: `Text selection comments for article: ${state.articleSlug}\n\nThis issue stores comments made on specific text selections in the article.`,
        labels: [CONFIG.label],
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create issue: ${createResponse.status}`);
    }

    const newIssue = await createResponse.json();
    sessionStorage.setItem(cacheKey, newIssue.number);
    return newIssue.number;
  }

  /**
   * Load comments from GitHub
   */
  async function loadComments() {
    try {
      const title = `[annotation] ${state.articleSlug}`;

      // Search for issue
      const response = await fetch(
        `https://api.github.com/repos/${CONFIG.repo}/issues?state=all&labels=${encodeURIComponent(CONFIG.label)}&per_page=100`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) return;

      const issues = await response.json();
      const issue = issues.find(i => i.title === title);

      if (!issue) return;

      // Cache issue number
      sessionStorage.setItem(`tsc_issue_${state.articleSlug}`, issue.number);

      // Fetch comments
      const commentsResponse = await fetch(
        `https://api.github.com/repos/${CONFIG.repo}/issues/${issue.number}/comments`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!commentsResponse.ok) return;

      const comments = await commentsResponse.json();

      // Parse comment data
      state.comments = [];
      state.unmatchedComments = [];

      comments.forEach(comment => {
        const parsed = parseCommentBody(comment.body);
        if (parsed) {
          parsed._id = comment.id;
          parsed._url = comment.html_url;
          state.comments.push(parsed);
        }
      });

      // Render highlights
      renderAllHighlights();

    } catch (error) {
      console.error('[TSC] Failed to load comments:', error);
    }
  }

  /**
   * Parse comment body to extract JSON data
   */
  function parseCommentBody(body) {
    if (!body) return null;

    // Try to extract JSON from code block
    const codeBlockMatch = body.match(/```json\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (e) {
        // Fall through
      }
    }

    // Try to parse entire body as JSON
    try {
      return JSON.parse(body);
    } catch (e) {
      // Not JSON
    }

    return null;
  }

  /**
   * Render all highlights
   */
  function renderAllHighlights() {
    // Clear existing highlights
    clearHighlights();

    // Render each comment
    state.comments.forEach(comment => {
      renderHighlight(comment);
    });

    // Render unmatched comments section if any
    if (state.unmatchedComments.length > 0) {
      renderUnmatchedComments();
    }
  }

  /**
   * Clear all highlights
   */
  function clearHighlights() {
    const contentEl = document.querySelector(CONFIG.contentSelector);
    if (!contentEl) return;

    // Remove tsc-mark elements but preserve text
    const marks = contentEl.querySelectorAll('tsc-mark');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
    });

    // Normalize text nodes
    contentEl.normalize();

    // Remove unmatched section if exists
    const unmatchedSection = contentEl.querySelector('.tsc-unmatched-section');
    if (unmatchedSection) {
      unmatchedSection.remove();
    }
  }

  /**
   * Render a single highlight
   */
  function renderHighlight(comment) {
    const contentEl = document.querySelector(CONFIG.contentSelector);
    if (!contentEl) return;

    // Find text position
    const walker = document.createTreeWalker(
      contentEl,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let textNode;
    let found = false;

    while (textNode = walker.nextNode()) {
      const text = textNode.textContent;
      const index = text.indexOf(comment.selectedText);

      if (index !== -1) {
        // Verify context if available
        const prefix = text.substring(Math.max(0, index - CONFIG.contextLength), index);
        const suffix = text.substring(index + comment.selectedText.length, index + comment.selectedText.length + CONFIG.contextLength);

        const prefixMatch = !comment.prefix || prefix.includes(comment.prefix.slice(-10)) || comment.prefix.includes(prefix.slice(-10));
        const suffixMatch = !comment.suffix || suffix.includes(comment.suffix.slice(0, 10)) || comment.suffix.includes(suffix.slice(0, 10));

        if (prefixMatch && suffixMatch) {
          // Wrap the text in a mark element
          const mark = document.createElement('tsc-mark');
          mark.dataset.commentId = comment._id || '';

          const range = document.createRange();
          range.setStart(textNode, index);
          range.setEnd(textNode, index + comment.selectedText.length);

          try {
            range.surroundContents(mark);
            found = true;

            // Bind hover events
            mark.addEventListener('mouseenter', (e) => showTooltip(e, comment));
            mark.addEventListener('mouseleave', hideTooltip);

            break;
          } catch (e) {
            // If surroundContents fails (crosses element boundaries), skip
            continue;
          }
        }
      }
    }

    if (!found) {
      // Add to unmatched comments
      state.unmatchedComments.push(comment);
    }
  }

  /**
   * Show tooltip for a comment
   */
  function showTooltip(e, comment) {
    clearTimeout(state.tooltipHideTimer);
    const mark = e.target;
    const rect = mark.getBoundingClientRect();

    const date = new Date(comment.createdAt);
    const dateStr = date.toLocaleDateString('zh-CN');

    const isOwner = state.isAuthenticated && state.currentUser &&
      comment.author && state.currentUser.login === comment.author;

    state.tooltip.innerHTML = `
      <div class="tsc-tooltip-header">
        <div class="tsc-tooltip-author">${escapeHtml(comment.author || '匿名')}</div>
        <div class="tsc-tooltip-header-actions">
          ${comment._url ? `<a class="tsc-tooltip-github-link" href="${comment._url}" target="_blank" rel="noopener noreferrer" title="在 GitHub 上查看">${ICONS.github}</a>` : ''}
          ${isOwner ? `<button class="tsc-tooltip-action-btn tsc-tooltip-edit-btn" title="编辑">${ICONS.edit}</button>` : ''}
          ${isOwner ? `<button class="tsc-tooltip-action-btn tsc-tooltip-delete-btn" title="删除">${ICONS.delete}</button>` : ''}
        </div>
      </div>
      <div class="tsc-tooltip-date">${dateStr}</div>
      <div class="tsc-tooltip-comment">${escapeHtml(comment.comment)}</div>
    `;

    // Bind edit/delete events
    if (isOwner) {
      const editBtn = state.tooltip.querySelector('.tsc-tooltip-edit-btn');
      const deleteBtn = state.tooltip.querySelector('.tsc-tooltip-delete-btn');
      editBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        state.tooltip.classList.remove('visible');
        showEditPopover(comment);
      });
      deleteBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        state.tooltip.classList.remove('visible');
        showDeleteConfirm(comment);
      });
    }

    // Position above the mark
    const tooltipWidth = state.tooltip.offsetWidth || 200;
    const tooltipHeight = state.tooltip.offsetHeight || 100;

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - tooltipHeight - 8;

    // Ensure within viewport
    const viewportWidth = window.innerWidth;
    if (left < 8) left = 8;
    if (left + tooltipWidth > viewportWidth - 8) {
      left = viewportWidth - tooltipWidth - 8;
    }
    if (top < 8) {
      top = rect.bottom + 8;
    }

    state.tooltip.style.left = `${left}px`;
    state.tooltip.style.top = `${top + window.scrollY}px`;
    state.tooltip.classList.add('visible');
  }

  /**
   * Hide tooltip with delay to allow mouse to move to tooltip
   */
  function hideTooltip() {
    state.tooltipHideTimer = setTimeout(() => {
      if (state.tooltip) {
        state.tooltip.classList.remove('visible');
      }
    }, 150);
  }

  /**
   * Show edit popover for a comment
   */
  function showEditPopover(comment) {
    // Save scroll position before any changes
    const scrollPos = {
      scrollX: window.scrollX || window.pageXOffset,
      scrollY: window.scrollY || window.pageYOffset
    };

    state.popover.innerHTML = `
      <div class="tsc-popover-header">
        <span class="tsc-popover-title">编辑评论</span>
        <button class="tsc-popover-close" title="关闭">${ICONS.close}</button>
      </div>
      <div class="tsc-popover-selected-text" style="margin-bottom: 12px; padding: 8px; background: var(--color-bg-secondary, #f6f8fa); border-radius: 6px; font-size: 13px; color: var(--color-text-secondary, #586069); font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        "${escapeHtml(comment.selectedText)}"
      </div>
      <textarea class="tsc-popover-textarea" placeholder="写下你的评论..." rows="3">${escapeHtml(comment.comment)}</textarea>
      <div class="tsc-popover-actions">
        <button class="tsc-btn tsc-btn-secondary tsc-btn-cancel">取消</button>
        <button class="tsc-btn tsc-btn-primary tsc-btn-submit">保存</button>
      </div>
    `;

    state.popover.querySelector('.tsc-popover-close').addEventListener('click', hidePopover);
    state.popover.querySelector('.tsc-btn-cancel').addEventListener('click', hidePopover);
    state.popover.querySelector('.tsc-btn-submit').addEventListener('click', () => {
      handleEditSubmit(comment);
    });

    // Position in center of viewport
    positionPopover(null);
    state.popover.classList.add('visible');

    const textarea = state.popover.querySelector('.tsc-popover-textarea');
    // Use preventScroll to avoid page jumping when focusing
    try {
      textarea.focus({ preventScroll: true });
    } catch (e) {
      // Fallback for older browsers
      textarea.focus();
    }
    // Restore scroll position as a safeguard
    window.scrollTo(scrollPos.scrollX, scrollPos.scrollY);

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleEditSubmit(comment);
      }
    });
  }

  /**
   * Handle edit comment submission
   */
  async function handleEditSubmit(comment) {
    const textarea = state.popover.querySelector('.tsc-popover-textarea');
    const newText = textarea.value.trim();

    if (!newText) {
      textarea.focus();
      return;
    }

    if (newText === comment.comment) {
      hidePopover();
      return;
    }

    const submitBtn = state.popover.querySelector('.tsc-btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '保存中...';

    try {
      // Build updated comment data
      const updatedData = {
        selectedText: comment.selectedText,
        prefix: comment.prefix,
        suffix: comment.suffix,
        paragraphIndex: comment.paragraphIndex,
        comment: newText,
        author: comment.author,
        createdAt: comment.createdAt,
      };

      await updateCommentOnGitHub(comment._id, updatedData);

      // Update local state
      comment.comment = newText;

      hidePopover();

      // Re-render all highlights to reflect the change
      state.unmatchedComments = [];
      renderAllHighlights();
    } catch (error) {
      console.error('[TSC] Failed to edit comment:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = '保存';
      alert('编辑评论失败，请重试');
    }
  }

  /**
   * Update a comment on GitHub
   */
  async function updateCommentOnGitHub(commentId, commentData) {
    const response = await fetch(`https://api.github.com/repos/${CONFIG.repo}/issues/comments/${commentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${state.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: '```json\n' + JSON.stringify(commentData, null, 2) + '\n```',
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthState();
        throw new Error('Authentication expired');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Show delete confirmation dialog
   */
  function showDeleteConfirm(comment) {
    state.popover.innerHTML = `
      <div class="tsc-popover-header">
        <span class="tsc-popover-title">删除评论</span>
        <button class="tsc-popover-close" title="关闭">${ICONS.close}</button>
      </div>
      <div class="tsc-delete-confirm">
        <p class="tsc-delete-confirm-text">确定要删除这条评论吗？此操作无法撤销。</p>
        <div class="tsc-delete-confirm-quote">"${escapeHtml(comment.comment)}"</div>
        <div class="tsc-popover-actions">
          <button class="tsc-btn tsc-btn-secondary tsc-btn-cancel">取消</button>
          <button class="tsc-btn tsc-btn-danger tsc-btn-confirm-delete">删除</button>
        </div>
      </div>
    `;

    state.popover.querySelector('.tsc-popover-close').addEventListener('click', hidePopover);
    state.popover.querySelector('.tsc-btn-cancel').addEventListener('click', hidePopover);
    state.popover.querySelector('.tsc-btn-confirm-delete').addEventListener('click', () => {
      handleDeleteConfirm(comment);
    });

    positionPopover(null);
    state.popover.classList.add('visible');
  }

  /**
   * Handle delete confirmation
   */
  async function handleDeleteConfirm(comment) {
    const deleteBtn = state.popover.querySelector('.tsc-btn-confirm-delete');
    deleteBtn.disabled = true;
    deleteBtn.textContent = '删除中...';

    try {
      await deleteCommentOnGitHub(comment._id);

      // Remove from local state
      state.comments = state.comments.filter(c => c._id !== comment._id);
      state.unmatchedComments = state.unmatchedComments.filter(c => c._id !== comment._id);

      hidePopover();

      // Re-render highlights
      renderAllHighlights();
    } catch (error) {
      console.error('[TSC] Failed to delete comment:', error);
      deleteBtn.disabled = false;
      deleteBtn.textContent = '删除';
      alert('删除评论失败，请重试');
    }
  }

  /**
   * Delete a comment on GitHub
   */
  async function deleteCommentOnGitHub(commentId) {
    const response = await fetch(`https://api.github.com/repos/${CONFIG.repo}/issues/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${state.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthState();
        throw new Error('Authentication expired');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
  }

  /**
   * Render unmatched comments section
   */
  function renderUnmatchedComments() {
    const contentEl = document.querySelector(CONFIG.contentSelector);
    if (!contentEl || state.unmatchedComments.length === 0) return;

    const section = document.createElement('div');
    section.className = 'tsc-unmatched-section';

    let itemsHtml = '';
    state.unmatchedComments.forEach((comment, idx) => {
      const date = new Date(comment.createdAt);
      const dateStr = date.toLocaleDateString('zh-CN');

      const isOwner = state.isAuthenticated && state.currentUser &&
        comment.author && state.currentUser.login === comment.author;

      itemsHtml += `
        <div class="tsc-unmatched-item" data-unmatched-idx="${idx}">
          <div class="tsc-unmatched-header">
            <div class="tsc-unmatched-meta">${escapeHtml(comment.author || '匿名')} · ${dateStr}</div>
            ${isOwner ? `
              <div class="tsc-unmatched-actions">
                <button class="tsc-unmatched-action-btn tsc-unmatched-edit-btn" title="编辑" data-idx="${idx}">${ICONS.edit}</button>
                <button class="tsc-unmatched-action-btn tsc-unmatched-delete-btn" title="删除" data-idx="${idx}">${ICONS.delete}</button>
              </div>
            ` : ''}
          </div>
          <div class="tsc-unmatched-text">"${escapeHtml(comment.selectedText)}"</div>
          <div style="margin-top: 8px; color: var(--color-text-primary);">${escapeHtml(comment.comment)}</div>
        </div>
      `;
    });

    section.innerHTML = `
      <div class="tsc-unmatched-title">未定位的评论 (${state.unmatchedComments.length})</div>
      ${itemsHtml}
    `;

    // Bind edit/delete buttons for unmatched comments
    section.querySelectorAll('.tsc-unmatched-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        showEditPopover(state.unmatchedComments[idx]);
      });
    });
    section.querySelectorAll('.tsc-unmatched-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        showDeleteConfirm(state.unmatchedComments[idx]);
      });
    });

    contentEl.appendChild(section);
  }

  /**
   * Handle document click (to close popover)
   */
  function handleDocumentClick(e) {
    if (state.popover && state.popover.classList.contains('visible')) {
      if (!state.popover.contains(e.target) && !state.toolbar.contains(e.target)) {
        hidePopover();
      }
    }
  }

  /**
   * Handle keydown events
   */
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      hidePopover();
      hideTooltip();
    }
  }

  /**
   * Handle theme change
   */
  function handleThemeChange() {
    // Theme change is handled automatically via CSS variables
  }

  /**
   * Escape HTML special characters
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external access
  window.TextSelectionComment = {
    init,
    isAuthenticated: () => state.isAuthenticated,
    getComments: () => state.comments,
    refresh: loadComments,
  };

})();
