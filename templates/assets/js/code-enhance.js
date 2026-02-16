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

  // --- Enhance each code block ---
  var codeBlocks = document.querySelectorAll('pre > code');
  codeBlocks.forEach(function (codeEl) {
    var preEl = codeEl.parentElement;
    if (!preEl) return;
    preEl.style.position = 'relative';

    // Detect language from hljs result class (e.g. "hljs language-javascript" or "language-python")
    var lang = '';
    var classes = codeEl.className.split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      var match = classes[i].match(/^language-(.+)$/);
      if (match) {
        lang = match[1];
        break;
      }
    }

    // --- Language badge ---
    if (lang) {
      var badge = document.createElement('span');
      badge.className = 'code-lang-badge';
      badge.textContent = lang;
      preEl.appendChild(badge);
    }

    // --- Copy button ---
    var btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

    btn.addEventListener('click', function () {
      var text = codeEl.textContent || '';
      copyToClipboard(text, btn);
    });

    preEl.appendChild(btn);
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
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    btn.classList.add('copied');
    setTimeout(function () {
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      btn.classList.remove('copied');
    }, 2000);
  }
});
