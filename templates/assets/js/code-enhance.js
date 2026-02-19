/**
 * Code block enhancements: syntax highlighting, copy button, language badge
 */
document.addEventListener('DOMContentLoaded', function () {
  // --- Theme sync for Highlight.js stylesheets ---
  var lightSheet = document.getElementById('hljs-light');
  var darkSheet = document.getElementById('hljs-dark');
  var root = document.documentElement;
  var themeBody = document.getElementById('theme-body');

  function isDarkTheme() {
    return (themeBody && themeBody.getAttribute('data-theme') === 'dark') ||
      root.getAttribute('data-theme') === 'dark';
  }

  function syncHljsTheme() {
    var isDark = isDarkTheme();
    if (lightSheet && darkSheet) {
      lightSheet.disabled = isDark;
      darkSheet.disabled = !isDark;
    }
  }

  // Set initial theme
  syncHljsTheme();

  // Observe data-theme changes on <body> and <html> to stay in sync with toggle.
  if (themeBody && typeof MutationObserver !== 'undefined') {
    new MutationObserver(syncHljsTheme).observe(themeBody, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(syncHljsTheme).observe(root, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  // --- Highlight.js initialization ---
  if (typeof hljs !== 'undefined') {
    hljs.highlightAll();
  }

  // --- SVG icons ---
  var ICON_COPY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  var ICON_COPIED = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  var ICON_EXPAND = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';

  // --- Fullscreen overlay (shared singleton) ---
  var overlay = null;

  function openFullscreen(preEl) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'code-fullscreen-overlay';
      var closeBtn = document.createElement('button');
      closeBtn.className = 'code-fullscreen-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.setAttribute('aria-label', 'Close fullscreen');
      closeBtn.addEventListener('click', closeFullscreen);
      overlay.appendChild(closeBtn);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeFullscreen();
      });
      document.body.appendChild(overlay);
    }
    // Remove previous code content if any
    var oldPre = overlay.querySelector('pre');
    if (oldPre) overlay.removeChild(oldPre);
    // Clone the pre element without the header
    var clone = document.createElement('pre');
    var codeClone = preEl.querySelector('code').cloneNode(true);
    clone.appendChild(codeClone);
    overlay.appendChild(clone);
    // Activate
    document.body.classList.add('code-fullscreen-body');
    // Force reflow before adding active class for transition
    overlay.offsetHeight;
    overlay.classList.add('active');
  }

  function closeFullscreen() {
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.classList.remove('code-fullscreen-body');
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeFullscreen();
  });

  // --- Enhance each code block ---
  var codeBlocks = document.querySelectorAll('pre > code');
  codeBlocks.forEach(function (codeEl) {
    var preEl = codeEl.parentElement;
    if (!preEl) return;
    preEl.style.position = 'relative';

    // Detect language
    var lang = '';
    var classes = codeEl.className.split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      var match = classes[i].match(/^language-(.+)$/);
      if (match) {
        lang = match[1];
        break;
      }
    }

    // --- Build header bar ---
    var header = document.createElement('div');
    header.className = 'code-header';

    // Window dots
    var dots = document.createElement('span');
    dots.className = 'code-window-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(dots);

    // Language badge (centered via flex auto margins)
    if (lang) {
      var badge = document.createElement('span');
      badge.className = 'code-lang-badge';
      badge.textContent = lang;
      header.appendChild(badge);
    }

    // Action buttons container
    var actions = document.createElement('span');
    actions.className = 'code-header-actions';

    // Fullscreen button
    var fsBtn = document.createElement('button');
    fsBtn.className = 'code-fullscreen-btn';
    fsBtn.setAttribute('aria-label', 'Fullscreen');
    fsBtn.innerHTML = ICON_EXPAND;
    fsBtn.addEventListener('click', function () {
      openFullscreen(preEl);
    });
    actions.appendChild(fsBtn);

    // Copy button
    var copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.setAttribute('aria-label', 'Copy code');
    copyBtn.innerHTML = ICON_COPY;
    copyBtn.addEventListener('click', function () {
      var text = codeEl.textContent || '';
      copyToClipboard(text, copyBtn);
    });
    actions.appendChild(copyBtn);

    header.appendChild(actions);

    // Insert header as first child of pre
    preEl.insertBefore(header, preEl.firstChild);
  });

  // --- Clipboard helper ---
  function copyToClipboard(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showCopied(btn);
      }).catch(function () {
        fallbackCopy(text, btn);
      });
    } else {
      fallbackCopy(text, btn);
    }
  }

  function fallbackCopy(text, btn) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopied(btn);
    } catch (e) {
      // silently fail
    }
    document.body.removeChild(textarea);
  }

  function showCopied(btn) {
    btn.innerHTML = ICON_COPIED;
    btn.classList.add('copied');
    setTimeout(function () {
      btn.innerHTML = ICON_COPY;
      btn.classList.remove('copied');
    }, 2000);
  }
});
