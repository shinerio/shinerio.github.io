(function () {
  'use strict';

  const MODE_BROWSE = 'browse';
  const MODE_DRAW = 'draw';
  const MODE_HIGHLIGHT = 'highlight';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const MENU_ITEMS = [
    { action: 'mode', mode: MODE_BROWSE, label: 'Browse mode', shortcut: 'B' },
    { action: 'mode', mode: MODE_DRAW, label: 'Pen mode', shortcut: 'D' },
    { action: 'mode', mode: MODE_HIGHLIGHT, label: 'Text highlight', shortcut: 'H' },
    { action: 'undo', label: 'Undo last', shortcut: 'Ctrl+Z' },
    { action: 'clear', label: 'Clear annotations', shortcut: 'C' },
    { action: 'exit', label: 'Exit presenter', shortcut: 'Esc' }
  ];

  const MODE_LABELS = {
    browse: 'Browse',
    draw: 'Pen',
    highlight: 'Highlight'
  };

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
    const toggleBtn = document.querySelector('[data-presenter-toggle]');
    const sourceArticle = document.querySelector('.article-main-column article');

    if (!toggleBtn || !sourceArticle || !document.body.classList.contains('article-page')) {
      return;
    }

    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      toggleBtn.hidden = true;
      return;
    }

    const state = {
      active: false,
      mode: MODE_BROWSE,
      toggleBtn: toggleBtn,
      sourceArticle: sourceArticle,
      shell: null,
      shellInner: null,
      stage: null,
      presenterArticle: null,
      presenterContent: null,
      menu: null,
      badge: null,
      annotations: null,
      canvas: null,
      interaction: null,
      drawing: false,
      currentPath: null,
      currentPoints: [],
      annotationHistory: [],
      badgeTimer: null,
      highlightCount: 0,
      moveHandler: null,
      upHandler: null,
      keyHandler: null,
      resizeHandler: null,
      clickHandler: null,
      contextHandler: null,
      scrollHandler: null,
      fullscreenHandler: null
    };

    toggleBtn.addEventListener('click', function () {
      if (state.active) {
        exitPresenter(state);
      } else {
        enterPresenter(state);
      }
    });
  }

  function enterPresenter(state) {
    if (state.active) {
      return;
    }

    state.active = true;
    buildShell(state);
    document.body.classList.add('presenter-shell-open');
    setMode(state, MODE_BROWSE);
    updateStageBounds(state);
    bindShellEvents(state);
    flashBadge(state, 'Presenter mode enabled');

    if (state.shell.requestFullscreen) {
      state.shell.requestFullscreen().catch(function () {
        return undefined;
      });
    }
  }

  function buildShell(state) {
    state.shell = document.createElement('div');
    state.shell.className = 'article-presenter-shell presenter-mode-browse';

    state.shellInner = document.createElement('div');
    state.shellInner.className = 'article-presenter-shell-inner';

    state.stage = document.createElement('div');
    state.stage.className = 'article-presenter-stage';

    state.presenterArticle = state.sourceArticle.cloneNode(true);
    const clonedActions = state.presenterArticle.querySelector('.article-header-actions');
    if (clonedActions) {
      clonedActions.remove();
    }
    state.presenterContent = state.presenterArticle.querySelector('.content');

    const documentWrap = document.createElement('div');
    documentWrap.className = 'article-presenter-document';
    documentWrap.appendChild(state.presenterArticle);

    state.annotations = document.createElement('div');
    state.annotations.className = 'article-presenter-annotations';

    state.canvas = document.createElementNS(SVG_NS, 'svg');
    state.canvas.setAttribute('class', 'article-presenter-canvas');
    state.canvas.setAttribute('aria-hidden', 'true');

    state.interaction = document.createElement('div');
    state.interaction.className = 'article-presenter-interaction';

    state.menu = document.createElement('div');
    state.menu.className = 'article-presenter-menu';
    state.menu.innerHTML = [
      '<div class="article-presenter-menu-header">Presenter controls</div>',
      MENU_ITEMS.map(function (item) {
        const modeAttr = item.mode ? ` data-mode="${item.mode}"` : '';
        return `<button type="button" data-action="${item.action}"${modeAttr}>` +
          `<span>${item.label}</span>` +
          `<span class="article-presenter-menu-shortcut">${item.shortcut}</span>` +
          '</button>';
      }).join('')
    ].join('');

    state.badge = document.createElement('div');
    state.badge.className = 'article-presenter-badge';

    state.stage.appendChild(documentWrap);
    state.stage.appendChild(state.annotations);
    state.stage.appendChild(state.canvas);
    state.stage.appendChild(state.interaction);
    state.shellInner.appendChild(state.stage);
    state.shell.appendChild(state.shellInner);
    state.shell.appendChild(state.menu);
    state.shell.appendChild(state.badge);
    document.body.appendChild(state.shell);
  }

  function bindShellEvents(state) {
    state.moveHandler = function (event) {
      if (!state.active) {
        return;
      }

      if (state.drawing) {
        appendPathPoint(state, event);
      }
    };

    state.upHandler = function (event) {
      if (!state.active) {
        return;
      }

      if (state.drawing && event.button === 0) {
        finishPath(state);
      }

      if (state.mode === MODE_HIGHLIGHT && event.button === 0) {
        window.setTimeout(function () {
          addSelectionHighlight(state, event.target);
        }, 0);
      }
    };

    state.keyHandler = function (event) {
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
      if ((event.ctrlKey || event.metaKey) && key === 'z') {
        event.preventDefault();
        undoLastAnnotation(state);
      } else if (key === 'b') {
        setMode(state, MODE_BROWSE);
      } else if (key === 'd') {
        setMode(state, MODE_DRAW);
      } else if (key === 'h') {
        setMode(state, MODE_HIGHLIGHT);
      } else if (key === 'c') {
        clearAnnotations(state);
        flashBadge(state, 'Annotations cleared');
      }
    };

    state.resizeHandler = function () {
      if (state.active) {
        updateStageBounds(state);
      }
    };

    state.scrollHandler = function () {
      if (state.active) {
        updateStageBounds(state);
      }
    };

    state.clickHandler = function (event) {
      if (!state.active) {
        return;
      }

      if (!event.target.closest('.article-presenter-menu')) {
        hideMenu(state);
      }
    };

    state.contextHandler = function (event) {
      if (!state.active) {
        return;
      }

      event.preventDefault();
      openMenu(state, event.clientX, event.clientY);
    };

    state.fullscreenHandler = function () {
      if (state.active && !document.fullscreenElement) {
        updateStageBounds(state);
      }
    };

    document.addEventListener('mousemove', state.moveHandler);
    document.addEventListener('mouseup', state.upHandler);
    document.addEventListener('keydown', state.keyHandler);
    window.addEventListener('resize', state.resizeHandler);
    document.addEventListener('fullscreenchange', state.fullscreenHandler);
    state.shellInner.addEventListener('scroll', state.scrollHandler, { passive: true });
    state.shell.addEventListener('click', state.clickHandler);
    state.shell.addEventListener('contextmenu', state.contextHandler);

    state.interaction.addEventListener('mousedown', function (event) {
      if (!state.active || state.mode !== MODE_DRAW || event.button !== 0) {
        return;
      }

      event.preventDefault();
      startPath(state, event);
    });

    state.menu.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) {
        return;
      }

      const action = button.getAttribute('data-action');
      if (action === 'mode') {
        setMode(state, button.getAttribute('data-mode') || MODE_BROWSE);
        hideMenu(state);
      } else if (action === 'undo') {
        undoLastAnnotation(state);
        hideMenu(state);
      } else if (action === 'clear') {
        clearAnnotations(state);
        hideMenu(state);
        flashBadge(state, 'Annotations cleared');
      } else if (action === 'exit') {
        exitPresenter(state);
      }
    });
  }

  function setMode(state, mode) {
    state.mode = mode;
    state.shell.classList.remove('presenter-mode-browse', 'presenter-mode-draw', 'presenter-mode-highlight');
    state.shell.classList.add(`presenter-mode-${mode}`);
    updateMenuState(state);
    updateBadge(state);
  }

  function updateMenuState(state) {
    state.menu.querySelectorAll('button[data-mode]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-mode') === state.mode);
    });
  }

  function updateBadge(state) {
    state.badge.innerHTML = `Mode: <span class="article-presenter-mode-text">${MODE_LABELS[state.mode]}</span>`;
    state.badge.classList.add('visible');
  }

  function flashBadge(state, message) {
    window.clearTimeout(state.badgeTimer);
    state.badge.textContent = message;
    state.badge.classList.add('visible');
    state.badgeTimer = window.setTimeout(function () {
      if (state.active) {
        updateBadge(state);
      }
    }, 1100);
  }

  function openMenu(state, clientX, clientY) {
    const padding = 16;
    state.menu.classList.add('visible');
    updateMenuState(state);

    const menuRect = state.menu.getBoundingClientRect();
    const left = Math.min(Math.max(padding, clientX), window.innerWidth - menuRect.width - padding);
    const top = Math.min(Math.max(padding, clientY), window.innerHeight - menuRect.height - padding);

    state.menu.style.left = `${left}px`;
    state.menu.style.top = `${top}px`;
  }

  function hideMenu(state) {
    if (state.menu) {
      state.menu.classList.remove('visible');
    }
  }

  function updateStageBounds(state) {
    if (!state.stage || !state.canvas) {
      return;
    }

    const width = Math.max(state.stage.scrollWidth, state.stage.offsetWidth);
    const height = Math.max(state.stage.scrollHeight, state.stage.offsetHeight);

    state.annotations.style.width = `${width}px`;
    state.annotations.style.height = `${height}px`;
    state.interaction.style.width = `${width}px`;
    state.interaction.style.height = `${height}px`;
    state.canvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
    state.canvas.setAttribute('width', String(width));
    state.canvas.setAttribute('height', String(height));
  }

  function getStagePoint(state, event) {
    const stageRect = state.stage.getBoundingClientRect();
    return {
      x: event.clientX - stageRect.left + state.shellInner.scrollLeft,
      y: event.clientY - stageRect.top + state.shellInner.scrollTop
    };
  }

  function startPath(state, event) {
    updateStageBounds(state);
    state.drawing = true;
    state.currentPoints = [getStagePoint(state, event)];
    state.currentPath = document.createElementNS(SVG_NS, 'path');
    state.currentPath.setAttribute('fill', 'none');
    state.currentPath.setAttribute('stroke', '#c88b12');
    state.currentPath.setAttribute('stroke-width', '4');
    state.currentPath.setAttribute('stroke-linecap', 'round');
    state.currentPath.setAttribute('stroke-linejoin', 'round');
    state.currentPath.setAttribute('d', buildPathData(state.currentPoints));
    state.canvas.appendChild(state.currentPath);
  }

  function appendPathPoint(state, event) {
    if (!state.currentPath) {
      return;
    }

    const point = getStagePoint(state, event);
    const lastPoint = state.currentPoints[state.currentPoints.length - 1];
    if (lastPoint && Math.abs(lastPoint.x - point.x) < 1 && Math.abs(lastPoint.y - point.y) < 1) {
      return;
    }

    state.currentPoints.push(point);
    state.currentPath.setAttribute('d', buildPathData(state.currentPoints));
  }

  function finishPath(state) {
    if (!state.currentPath) {
      return;
    }

    if (state.currentPoints.length < 2) {
      state.currentPath.remove();
    } else {
      recordAnnotation(state, state.currentPath);
    }

    state.currentPath = null;
    state.currentPoints = [];
    state.drawing = false;
  }

  function buildPathData(points) {
    return points.map(function (point, index) {
      return `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`;
    }).join(' ');
  }

  function addSelectionHighlight(state, eventTarget) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!state.presenterContent.contains(range.commonAncestorContainer)) {
      clearSelection();
      return;
    }

    if (!isSelectionAllowed(range, eventTarget)) {
      clearSelection();
      return;
    }

    const stageRect = state.stage.getBoundingClientRect();
    const rects = Array.from(range.getClientRects()).filter(function (rect) {
      return rect.width > 2 && rect.height > 2;
    });

    if (rects.length === 0) {
      clearSelection();
      return;
    }

    const group = document.createElement('div');
    group.className = 'article-presenter-highlight-group';
    group.setAttribute('data-highlight-id', String(++state.highlightCount));

    rects.forEach(function (rect) {
      const marker = document.createElement('div');
      marker.className = 'article-presenter-highlight-rect';
      marker.style.left = `${rect.left - stageRect.left + state.shellInner.scrollLeft}px`;
      marker.style.top = `${rect.top - stageRect.top + state.shellInner.scrollTop}px`;
      marker.style.width = `${rect.width}px`;
      marker.style.height = `${rect.height}px`;
      group.appendChild(marker);
    });

    state.annotations.appendChild(group);
    recordAnnotation(state, group);
    clearSelection();
  }

  function isSelectionAllowed(range, eventTarget) {
    const elements = [
      toElement(eventTarget),
      toElement(range.startContainer),
      toElement(range.endContainer)
    ];

    return elements.every(function (element) {
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

  function recordAnnotation(state, node) {
    state.annotationHistory.push(node);
  }

  function undoLastAnnotation(state) {
    const lastNode = state.annotationHistory.pop();
    if (!lastNode) {
      flashBadge(state, 'Nothing to undo');
      return;
    }

    if (lastNode.parentNode) {
      lastNode.parentNode.removeChild(lastNode);
    }

    flashBadge(state, 'Last annotation removed');
  }

  function clearAnnotations(state) {
    if (state.annotations) {
      state.annotations.innerHTML = '';
    }

    if (state.canvas) {
      while (state.canvas.firstChild) {
        state.canvas.removeChild(state.canvas.firstChild);
      }
    }

    state.annotationHistory = [];
  }

  function clearSelection() {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }

  function exitPresenter(state) {
    if (!state.active) {
      return;
    }

    state.active = false;
    clearAnnotations(state);
    clearSelection();
    hideMenu(state);
    window.clearTimeout(state.badgeTimer);
    document.body.classList.remove('presenter-shell-open');

    if (state.shellInner && state.scrollHandler) {
      state.shellInner.removeEventListener('scroll', state.scrollHandler);
    }

    if (state.moveHandler) {
      document.removeEventListener('mousemove', state.moveHandler);
    }
    if (state.upHandler) {
      document.removeEventListener('mouseup', state.upHandler);
    }
    if (state.keyHandler) {
      document.removeEventListener('keydown', state.keyHandler);
    }
    if (state.resizeHandler) {
      window.removeEventListener('resize', state.resizeHandler);
    }
    if (state.fullscreenHandler) {
      document.removeEventListener('fullscreenchange', state.fullscreenHandler);
    }

    if (document.fullscreenElement === state.shell && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {
        return undefined;
      });
    }

    if (state.shell) {
      state.shell.remove();
    }

    state.shell = null;
    state.shellInner = null;
    state.stage = null;
    state.presenterArticle = null;
    state.presenterContent = null;
    state.menu = null;
    state.badge = null;
    state.annotations = null;
    state.canvas = null;
    state.interaction = null;
    state.currentPath = null;
    state.currentPoints = [];
    state.annotationHistory = [];
    state.drawing = false;
    state.highlightCount = 0;
  }
})();
