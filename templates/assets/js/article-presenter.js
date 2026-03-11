(function () {
  'use strict';

  const MODE_BROWSE = 'browse';
  const MODE_DRAW = 'draw';
  const MODE_HIGHLIGHT = 'highlight';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const MENU_ITEMS = [
    { action: 'mode', mode: MODE_BROWSE, label: '浏览模式', shortcut: 'B' },
    { action: 'mode', mode: MODE_DRAW, label: '画笔模式', shortcut: 'D' },
    { action: 'mode', mode: MODE_HIGHLIGHT, label: '荧光划词', shortcut: 'H' },
    { action: 'clear', label: '清空标注', shortcut: 'C' },
    { action: 'exit', label: '退出演示', shortcut: 'Esc' }
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
      spotlight: null,
      menu: null,
      badge: null,
      annotations: null,
      canvas: null,
      interaction: null,
      drawing: false,
      currentPath: null,
      currentPoints: [],
      badgeTimer: null,
      highlightCount: 0,
      moveHandler: null,
      upHandler: null,
      keyHandler: null,
      resizeHandler: null,
      clickHandler: null,
      contextHandler: null,
      scrollHandler: null
    };

    toggleBtn.addEventListener('click', function () {
      if (state.active) {
        exitPresenter(state);
        return;
      }

      enterPresenter(state);
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
    flashBadge(state, '演示者模式已开启');

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

    state.spotlight = document.createElement('div');
    state.spotlight.className = 'article-presenter-spotlight';

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
    state.shell.appendChild(state.spotlight);
    state.shell.appendChild(state.menu);
    state.shell.appendChild(state.badge);
    document.body.appendChild(state.shell);
  }

  function bindShellEvents(state) {
    state.moveHandler = function (event) {
      if (!state.active) {
        return;
      }

      moveSpotlight(state, event.clientX, event.clientY);

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
      if (key === 'b') {
        setMode(state, MODE_BROWSE);
      } else if (key === 'd') {
        setMode(state, MODE_DRAW);
      } else if (key === 'h') {
        setMode(state, MODE_HIGHLIGHT);
      } else if (key === 'c') {
        clearAnnotations(state);
        flashBadge(state, '已清空标注');
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

    document.addEventListener('mousemove', state.moveHandler);
    document.addEventListener('mouseup', state.upHandler);
    document.addEventListener('keydown', state.keyHandler);
    window.addEventListener('resize', state.resizeHandler);
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
        return;
      }

      if (action === 'clear') {
        clearAnnotations(state);
        hideMenu(state);
        flashBadge(state, '已清空标注');
        return;
      }

      if (action === 'exit') {
        exitPresenter(state);
      }
    });

    document.addEventListener('fullscreenchange', function onFullscreenChange() {
      if (!state.active) {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        return;
      }

      if (!document.fullscreenElement && state.shell) {
        updateStageBounds(state);
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
    const labels = {
      browse: '浏览',
      draw: '画笔',
      highlight: '荧光'
    };
    state.badge.innerHTML = `模式: <span class="article-presenter-mode-text">${labels[state.mode]}</span>`;
    state.badge.classList.add('visible');
  }

  function flashBadge(state, message) {
    window.clearTimeout(state.badgeTimer);
    state.badge.textContent = message;
    state.badge.classList.add('visible');
    state.badgeTimer = window.setTimeout(function () {
      if (!state.active) {
        return;
      }
      updateBadge(state);
    }, 1100);
  }

  function moveSpotlight(state, clientX, clientY) {
    state.spotlight.style.left = `${clientX}px`;
    state.spotlight.style.top = `${clientY}px`;
    state.spotlight.classList.add('visible');
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
    state.currentPath.setAttribute('stroke', '#ffb02e');
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

  function clearAnnotations(state) {
    if (state.annotations) {
      state.annotations.innerHTML = '';
    }

    if (state.canvas) {
      while (state.canvas.firstChild) {
        state.canvas.removeChild(state.canvas.firstChild);
      }
    }
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
    state.spotlight = null;
    state.menu = null;
    state.badge = null;
    state.annotations = null;
    state.canvas = null;
    state.interaction = null;
    state.currentPath = null;
    state.currentPoints = [];
    state.drawing = false;
    state.highlightCount = 0;
  }
})();
