(function () {
  'use strict';

  const MODE_BROWSE = 'browse';
  const MODE_DRAW = 'draw';
  const MODE_HIGHLIGHT = 'highlight';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const MENU_ITEMS = [
    { action: 'mode', mode: MODE_BROWSE, label: 'Browse mode', shortcut: 'B' },
    { action: 'mode', mode: MODE_DRAW, label: 'Draw mode', shortcut: 'D' },
    { action: 'mode', mode: MODE_HIGHLIGHT, label: 'Highlight text', shortcut: 'H' },
    { action: 'clear', label: 'Clear annotations', shortcut: 'C' },
    { action: 'exit', label: 'Exit presenter', shortcut: 'Esc' }
  ];

  const EXCLUDED_SELECTION_SELECTOR = [
    'pre',
    'code',
    'button',
    'input',
    'textarea',
    'select',
    '.code-header',
    '.comments-section',
    '.utterances-container',
    '.article-header-actions',
    '.article-presenter-menu',
    '.tsc-toolbar',
    '.tsc-popover',
    '.tsc-tooltip'
  ].join(', ');

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const body = document.body;
    const toggleBtn = document.querySelector('[data-presenter-toggle]');
    const contentEl = document.querySelector('.content');

    if (!body.classList.contains('article-page') || !toggleBtn || !contentEl) {
      return;
    }

    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      toggleBtn.hidden = true;
      return;
    }

    const state = {
      active: false,
      mode: MODE_BROWSE,
      body: body,
      toggleBtn: toggleBtn,
      contentEl: contentEl,
      layer: null,
      annotationsEl: null,
      svgEl: null,
      interactionEl: null,
      spotlightEl: null,
      menuEl: null,
      badgeEl: null,
      badgeTimer: null,
      drawing: false,
      currentPath: null,
      currentPathPoints: [],
      highlightCount: 0
    };

    createUi(state);
    bindEvents(state);
  }

  function createUi(state) {
    state.layer = document.createElement('div');
    state.layer.className = 'article-presenter-layer';
    state.layer.setAttribute('aria-hidden', 'true');

    state.annotationsEl = document.createElement('div');
    state.annotationsEl.className = 'article-presenter-annotations';

    state.svgEl = document.createElementNS(SVG_NS, 'svg');
    state.svgEl.setAttribute('class', 'article-presenter-canvas');
    state.svgEl.setAttribute('aria-hidden', 'true');

    state.interactionEl = document.createElement('div');
    state.interactionEl.className = 'article-presenter-interaction';

    state.layer.appendChild(state.annotationsEl);
    state.layer.appendChild(state.svgEl);
    state.layer.appendChild(state.interactionEl);

    state.spotlightEl = document.createElement('div');
    state.spotlightEl.className = 'article-presenter-spotlight';

    state.menuEl = document.createElement('div');
    state.menuEl.className = 'article-presenter-menu';
    state.menuEl.innerHTML = [
      '<div class="article-presenter-menu-header">Presenter controls</div>',
      MENU_ITEMS.map(function(item) {
        const modeAttr = item.mode ? ` data-mode="${item.mode}"` : '';
        return `<button type="button" data-action="${item.action}"${modeAttr}>` +
          `<span>${item.label}</span>` +
          `<span class="article-presenter-menu-shortcut">${item.shortcut}</span>` +
          '</button>';
      }).join('')
    ].join('');

    state.badgeEl = document.createElement('div');
    state.badgeEl.className = 'article-presenter-badge';

    document.body.appendChild(state.layer);
    document.body.appendChild(state.spotlightEl);
    document.body.appendChild(state.menuEl);
    document.body.appendChild(state.badgeEl);

    syncOverlayBounds(state);
    updateBadge(state);
  }

  function bindEvents(state) {
    state.toggleBtn.addEventListener('click', function() {
      if (state.active) {
        exitPresenter(state);
      } else {
        enterPresenter(state);
      }
    });

    state.menuEl.addEventListener('click', function(event) {
      const button = event.target.closest('button[data-action]');
      if (!button) {
        return;
      }

      const action = button.getAttribute('data-action');
      if (action === 'mode') {
        setMode(state, button.getAttribute('data-mode') || MODE_BROWSE);
        hideMenu(state);
        return;
      }

      if (action === 'clear') {
        clearAnnotations(state);
        hideMenu(state);
        flashBadge(state, 'Cleared annotations');
        return;
      }

      if (action === 'exit') {
        exitPresenter(state);
      }
    });

    document.addEventListener('mousemove', function(event) {
      if (!state.active) {
        return;
      }

      moveSpotlight(state, event.clientX, event.clientY);

      if (state.drawing) {
        appendPathPoint(state, event.pageX, event.pageY);
      }
    });

    document.addEventListener('contextmenu', function(event) {
      if (!state.active) {
        return;
      }

      if (state.menuEl.contains(event.target)) {
        return;
      }

      event.preventDefault();
      openMenu(state, event.clientX, event.clientY);
    });

    document.addEventListener('click', function(event) {
      if (!state.active) {
        return;
      }

      if (!event.target.closest('.article-presenter-menu')) {
        hideMenu(state);
      }
    });

    state.interactionEl.addEventListener('mousedown', function(event) {
      if (!state.active || state.mode !== MODE_DRAW || event.button !== 0) {
        return;
      }

      event.preventDefault();
      startPath(state, event.pageX, event.pageY);
    });

    document.addEventListener('mouseup', function(event) {
      if (!state.active) {
        return;
      }

      if (state.drawing && event.button === 0) {
        finishPath(state);
      }

      if (state.mode === MODE_HIGHLIGHT && event.button === 0) {
        window.setTimeout(function() {
          addSelectionHighlight(state, event.target);
        }, 0);
      }
    });

    document.addEventListener('keydown', function(event) {
      if (!state.active) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        exitPresenter(state);
        return;
      }

      if (event.target && /input|textarea|select/i.test(event.target.tagName)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'b') {
        setMode(state, MODE_BROWSE);
      } else if (key === 'd') {
        setMode(state, MODE_DRAW);
      } else if (key === 'h') {
        setMode(state, MODE_HIGHLIGHT);
      } else if (key === 'c') {
        clearAnnotations(state);
        flashBadge(state, 'Cleared annotations');
      }
    });

    window.addEventListener('resize', function() {
      if (state.active) {
        syncOverlayBounds(state);
      }
    });
  }

  function enterPresenter(state) {
    state.active = true;
    state.body.classList.add('presenter-mode-active');
    setMode(state, state.mode);
    syncOverlayBounds(state);
    flashBadge(state, 'Presenter mode');

    const root = document.documentElement;
    if (root.requestFullscreen) {
      root.requestFullscreen().catch(function() {
        return undefined;
      });
    }
  }

  function exitPresenter(state) {
    state.active = false;
    state.drawing = false;
    state.currentPath = null;
    state.currentPathPoints = [];
    clearAnnotations(state);
    hideMenu(state);
    state.spotlightEl.classList.remove('visible');
    state.badgeEl.classList.remove('visible');
    state.body.classList.remove('presenter-mode-active', 'presenter-mode-browse', 'presenter-mode-draw', 'presenter-mode-highlight');
    clearSelection();

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function() {
        return undefined;
      });
    }
  }

  function setMode(state, mode) {
    state.mode = mode;
    state.body.classList.remove('presenter-mode-browse', 'presenter-mode-draw', 'presenter-mode-highlight');
    state.body.classList.add(`presenter-mode-${mode}`);
    updateBadge(state);
    updateMenuState(state);
  }

  function updateMenuState(state) {
    state.menuEl.querySelectorAll('button[data-mode]').forEach(function(button) {
      button.classList.toggle('is-active', button.getAttribute('data-mode') === state.mode);
    });
  }

  function updateBadge(state) {
    const label = state.mode.charAt(0).toUpperCase() + state.mode.slice(1);
    state.badgeEl.innerHTML = `Mode: <span class="article-presenter-mode-text">${label}</span>`;
  }

  function flashBadge(state, message) {
    window.clearTimeout(state.badgeTimer);
    if (message) {
      state.badgeEl.textContent = message;
      state.badgeEl.classList.add('visible');
      state.badgeTimer = window.setTimeout(function() {
        updateBadge(state);
        if (state.active) {
          state.badgeEl.classList.add('visible');
        }
      }, 1200);
      return;
    }

    updateBadge(state);
    state.badgeEl.classList.add('visible');
  }

  function moveSpotlight(state, clientX, clientY) {
    state.spotlightEl.style.left = `${clientX}px`;
    state.spotlightEl.style.top = `${clientY}px`;
    state.spotlightEl.classList.add('visible');
    state.badgeEl.classList.add('visible');
  }

  function openMenu(state, clientX, clientY) {
    const padding = 14;
    state.menuEl.classList.add('visible');
    updateMenuState(state);

    const menuRect = state.menuEl.getBoundingClientRect();
    const left = Math.min(Math.max(padding, clientX), window.innerWidth - menuRect.width - padding);
    const top = Math.min(Math.max(padding, clientY), window.innerHeight - menuRect.height - padding);

    state.menuEl.style.left = `${left}px`;
    state.menuEl.style.top = `${top}px`;
  }

  function hideMenu(state) {
    state.menuEl.classList.remove('visible');
  }

  function syncOverlayBounds(state) {
    const doc = document.documentElement;
    const width = Math.max(doc.scrollWidth, window.innerWidth);
    const height = Math.max(doc.scrollHeight, document.body.scrollHeight, window.innerHeight);

    state.layer.style.width = `${width}px`;
    state.layer.style.height = `${height}px`;
    state.annotationsEl.style.height = `${height}px`;
    state.svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    state.svgEl.setAttribute('width', String(width));
    state.svgEl.setAttribute('height', String(height));
  }

  function startPath(state, pageX, pageY) {
    syncOverlayBounds(state);
    state.drawing = true;
    state.currentPathPoints = [{ x: pageX, y: pageY }];
    state.currentPath = document.createElementNS(SVG_NS, 'path');
    state.currentPath.setAttribute('fill', 'none');
    state.currentPath.setAttribute('stroke', '#ffb02e');
    state.currentPath.setAttribute('stroke-width', '4');
    state.currentPath.setAttribute('stroke-linecap', 'round');
    state.currentPath.setAttribute('stroke-linejoin', 'round');
    state.currentPath.setAttribute('d', buildPathData(state.currentPathPoints));
    state.svgEl.appendChild(state.currentPath);
  }

  function appendPathPoint(state, pageX, pageY) {
    if (!state.currentPath) {
      return;
    }

    const points = state.currentPathPoints;
    const lastPoint = points[points.length - 1];
    if (lastPoint && Math.abs(lastPoint.x - pageX) < 1 && Math.abs(lastPoint.y - pageY) < 1) {
      return;
    }

    points.push({ x: pageX, y: pageY });
    state.currentPath.setAttribute('d', buildPathData(points));
  }

  function finishPath(state) {
    if (!state.currentPath) {
      return;
    }

    if (state.currentPathPoints.length < 2) {
      state.currentPath.remove();
    }

    state.drawing = false;
    state.currentPath = null;
    state.currentPathPoints = [];
  }

  function buildPathData(points) {
    return points.map(function(point, index) {
      return `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`;
    }).join(' ');
  }

  function addSelectionHighlight(state, eventTarget) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!state.contentEl.contains(range.commonAncestorContainer)) {
      clearSelection();
      return;
    }

    if (!isSelectionAllowed(range, eventTarget)) {
      clearSelection();
      return;
    }

    const rects = Array.from(range.getClientRects()).filter(function(rect) {
      return rect.width > 2 && rect.height > 2;
    });

    if (rects.length === 0) {
      clearSelection();
      return;
    }

    syncOverlayBounds(state);

    const group = document.createElement('div');
    group.className = 'article-presenter-highlight-group';
    group.setAttribute('data-highlight-id', String(++state.highlightCount));

    rects.forEach(function(rect) {
      const marker = document.createElement('div');
      marker.className = 'article-presenter-highlight-rect';
      marker.style.left = `${rect.left + window.scrollX}px`;
      marker.style.top = `${rect.top + window.scrollY}px`;
      marker.style.width = `${rect.width}px`;
      marker.style.height = `${rect.height}px`;
      group.appendChild(marker);
    });

    state.annotationsEl.appendChild(group);
    clearSelection();
  }

  function isSelectionAllowed(range, eventTarget) {
    const elements = [
      toElement(eventTarget),
      toElement(range.startContainer),
      toElement(range.endContainer)
    ];

    return elements.every(function(element) {
      if (!element) {
        return true;
      }
      return !element.closest(EXCLUDED_SELECTION_SELECTOR);
    });
  }

  function toElement(node) {
    if (!node) {
      return null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      return node;
    }

    return node.parentElement || null;
  }

  function clearAnnotations(state) {
    state.annotationsEl.innerHTML = '';
    while (state.svgEl.firstChild) {
      state.svgEl.removeChild(state.svgEl.firstChild);
    }
  }

  function clearSelection() {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }
})();
