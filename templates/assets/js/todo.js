(function () {
  'use strict';

  // --- Config ---
  const configEl = document.getElementById('todo-config');
  if (!configEl) return;
  let CONFIG;
  try {
    CONFIG = JSON.parse(configEl.textContent);
  } catch (e) {
    console.error('Failed to parse todo config', e);
    return;
  }

  const TOKEN_KEY = 'github_todo_token';

  // --- DOM refs ---
  const dom = {
    auth: document.getElementById('todo-auth'),
    loginBtn: document.getElementById('todo-login-btn'),
    toolbar: document.getElementById('todo-toolbar'),
    addBtn: document.getElementById('todo-add-btn'),
    loading: document.getElementById('todo-loading'),
    error: document.getElementById('todo-error'),
    errorMsg: document.getElementById('todo-error-msg'),
    retryBtn: document.getElementById('todo-retry-btn'),
    board: document.getElementById('todo-board'),
    deviceModal: document.getElementById('todo-device-modal'),
    deviceCode: document.getElementById('todo-device-code'),
    deviceLink: document.getElementById('todo-device-link'),
    deviceStatus: document.getElementById('todo-device-status'),
    deviceCancel: document.getElementById('todo-device-cancel'),
    itemModal: document.getElementById('todo-item-modal'),
    itemModalTitle: document.getElementById('todo-item-modal-title'),
    itemForm: document.getElementById('todo-item-form'),
    itemTitle: document.getElementById('todo-item-title'),
    itemBody: document.getElementById('todo-item-body'),
    itemStatus: document.getElementById('todo-item-status'),
    statusGroup: document.getElementById('todo-status-group'),
    itemCancel: document.getElementById('todo-item-cancel')
  };

  // --- State ---
  let state = {
    token: localStorage.getItem(TOKEN_KEY),
    user: null,
    projectId: null,
    statusFieldId: null,
    statusOptions: [],
    items: [],
    editingItem: null,
    devicePollTimer: null
  };

  // --- GraphQL Client ---
  async function graphqlRequest(query, variables, token) {
    const resp = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': 'bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });
    const json = await resp.json();
    if (json.errors) {
      throw new Error(json.errors.map(function (e) { return e.message; }).join(', '));
    }
    return json.data;
  }

  // --- OAuth Device Flow ---
  async function startDeviceFlow() {
    if (!CONFIG.oauthClientId || !CONFIG.oauthProxyUrl) {
      showError('OAuth is not configured. Please set oauthClientId and oauthProxyUrl in blog.config.json.');
      return;
    }

    try {
      var resp = await fetch(CONFIG.oauthProxyUrl + '/device/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CONFIG.oauthClientId,
          scope: 'project'
        })
      });
      var data = await resp.json();

      if (data.error) {
        showError('Device flow error: ' + (data.error_description || data.error));
        return;
      }

      dom.deviceCode.textContent = data.user_code;
      dom.deviceLink.href = data.verification_uri || 'https://github.com/login/device';
      dom.deviceStatus.textContent = 'Waiting for authorization...';
      dom.deviceModal.style.display = 'flex';

      pollForToken(data.device_code, data.interval || 5);
    } catch (e) {
      showError('Failed to start device flow: ' + e.message);
    }
  }

  function pollForToken(deviceCode, interval) {
    if (state.devicePollTimer) clearInterval(state.devicePollTimer);

    state.devicePollTimer = setInterval(async function () {
      try {
        var resp = await fetch(CONFIG.oauthProxyUrl + '/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: CONFIG.oauthClientId,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          })
        });
        var data = await resp.json();

        if (data.access_token) {
          clearInterval(state.devicePollTimer);
          state.devicePollTimer = null;
          state.token = data.access_token;
          localStorage.setItem(TOKEN_KEY, data.access_token);
          dom.deviceModal.style.display = 'none';
          await initAuthed();
        } else if (data.error === 'authorization_pending') {
          dom.deviceStatus.textContent = 'Waiting for authorization...';
        } else if (data.error === 'slow_down') {
          dom.deviceStatus.textContent = 'Slowing down polling...';
        } else if (data.error === 'expired_token') {
          clearInterval(state.devicePollTimer);
          state.devicePollTimer = null;
          dom.deviceStatus.textContent = 'Code expired. Please try again.';
        } else if (data.error === 'access_denied') {
          clearInterval(state.devicePollTimer);
          state.devicePollTimer = null;
          dom.deviceStatus.textContent = 'Access denied.';
        }
      } catch (e) {
        dom.deviceStatus.textContent = 'Polling error: ' + e.message;
      }
    }, (interval + 1) * 1000);
  }

  // --- Auth UI ---
  function showLoggedIn(user) {
    dom.auth.innerHTML = '<span class="todo-user"><img src="' + user.avatarUrl + '" alt="' + user.login + '" class="todo-user-avatar">' +
      '<span class="todo-user-name">' + user.login + '</span></span>' +
      '<button class="todo-btn todo-btn-small" id="todo-logout-btn">Sign out</button>';
    document.getElementById('todo-logout-btn').addEventListener('click', logout);
    dom.toolbar.style.display = 'flex';
  }

  function showLoggedOut() {
    dom.auth.innerHTML = '<button class="todo-btn todo-btn-primary" id="todo-login-btn">Sign in with GitHub</button>';
    document.getElementById('todo-login-btn').addEventListener('click', startDeviceFlow);
    dom.toolbar.style.display = 'none';
  }

  function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem(TOKEN_KEY);
    showLoggedOut();
    dom.board.innerHTML = '';
    dom.loading.style.display = 'none';
  }

  // --- Data Fetching ---
  async function fetchUserInfo() {
    var data = await graphqlRequest('query { viewer { login avatarUrl } }', {}, state.token);
    return data.viewer;
  }

  async function fetchProjectData() {
    var query = 'query($login: String!, $number: Int!) {\n' +
      '  user(login: $login) {\n' +
      '    projectV2(number: $number) {\n' +
      '      id\n' +
      '      fields(first: 20) {\n' +
      '        nodes {\n' +
      '          ... on ProjectV2SingleSelectField {\n' +
      '            id\n' +
      '            name\n' +
      '            options { id name }\n' +
      '          }\n' +
      '        }\n' +
      '      }\n' +
      '      items(first: 100) {\n' +
      '        nodes {\n' +
      '          id\n' +
      '          fieldValues(first: 20) {\n' +
      '            nodes {\n' +
      '              ... on ProjectV2ItemFieldSingleSelectValue {\n' +
      '                name\n' +
      '                field { ... on ProjectV2SingleSelectField { name } }\n' +
      '                optionId\n' +
      '              }\n' +
      '            }\n' +
      '          }\n' +
      '          content {\n' +
      '            ... on DraftIssue {\n' +
      '              title\n' +
      '              body\n' +
      '            }\n' +
      '            ... on Issue {\n' +
      '              title\n' +
      '              body\n' +
      '              url\n' +
      '            }\n' +
      '          }\n' +
      '        }\n' +
      '      }\n' +
      '    }\n' +
      '  }\n' +
      '}';

    var data = await graphqlRequest(query, {
      login: CONFIG.githubUsername,
      number: CONFIG.projectNumber
    }, state.token);

    var project = data.user.projectV2;
    if (!project) throw new Error('Project not found');

    state.projectId = project.id;

    // Find Status field
    var statusField = null;
    for (var i = 0; i < project.fields.nodes.length; i++) {
      var field = project.fields.nodes[i];
      if (field.name === 'Status' && field.options) {
        statusField = field;
        break;
      }
    }

    if (statusField) {
      state.statusFieldId = statusField.id;
      state.statusOptions = statusField.options;
    } else {
      state.statusOptions = [{ id: null, name: 'No Status' }];
    }

    // Parse items
    state.items = project.items.nodes.map(function (item) {
      var statusValue = null;
      var statusOptionId = null;
      for (var j = 0; j < item.fieldValues.nodes.length; j++) {
        var fv = item.fieldValues.nodes[j];
        if (fv.field && fv.field.name === 'Status') {
          statusValue = fv.name;
          statusOptionId = fv.optionId;
          break;
        }
      }
      return {
        id: item.id,
        title: item.content ? item.content.title : '(untitled)',
        body: item.content ? (item.content.body || '') : '',
        url: item.content ? item.content.url : null,
        status: statusValue,
        statusOptionId: statusOptionId
      };
    });
  }

  // --- Mutations ---
  async function addDraftIssue(title, body) {
    var mutation = 'mutation($projectId: ID!, $title: String!, $body: String) {\n' +
      '  addProjectV2DraftIssue(input: {projectId: $projectId, title: $title, body: $body}) {\n' +
      '    projectItem { id }\n' +
      '  }\n' +
      '}';
    await graphqlRequest(mutation, {
      projectId: state.projectId,
      title: title,
      body: body
    }, state.token);
  }

  async function updateItemStatus(itemId, optionId) {
    if (!state.statusFieldId) return;
    var mutation = 'mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {\n' +
      '  updateProjectV2ItemFieldValue(input: {\n' +
      '    projectId: $projectId,\n' +
      '    itemId: $itemId,\n' +
      '    fieldId: $fieldId,\n' +
      '    value: { singleSelectOptionId: $optionId }\n' +
      '  }) {\n' +
      '    projectV2Item { id }\n' +
      '  }\n' +
      '}';
    await graphqlRequest(mutation, {
      projectId: state.projectId,
      itemId: itemId,
      fieldId: state.statusFieldId,
      optionId: optionId
    }, state.token);
  }

  async function deleteItem(itemId) {
    var mutation = 'mutation($projectId: ID!, $itemId: ID!) {\n' +
      '  deleteProjectV2Item(input: {projectId: $projectId, itemId: $itemId}) {\n' +
      '    deletedItemId\n' +
      '  }\n' +
      '}';
    await graphqlRequest(mutation, {
      projectId: state.projectId,
      itemId: itemId
    }, state.token);
  }

  // --- Board Rendering ---
  function renderBoard() {
    dom.board.innerHTML = '';

    var columns = {};
    var columnOrder = [];

    // Create columns from status options
    for (var i = 0; i < state.statusOptions.length; i++) {
      var opt = state.statusOptions[i];
      columns[opt.name] = [];
      columnOrder.push(opt.name);
    }

    // "No Status" column for items without a status
    if (!columns['No Status']) {
      columns['No Status'] = [];
      columnOrder.unshift('No Status');
    }

    // Distribute items
    for (var j = 0; j < state.items.length; j++) {
      var item = state.items[j];
      var col = item.status || 'No Status';
      if (!columns[col]) {
        columns[col] = [];
        columnOrder.push(col);
      }
      columns[col].push(item);
    }

    // Render columns
    for (var k = 0; k < columnOrder.length; k++) {
      var colName = columnOrder[k];
      var items = columns[colName];

      var colEl = document.createElement('div');
      colEl.className = 'todo-column';

      var headerEl = document.createElement('div');
      headerEl.className = 'todo-column-header';
      headerEl.innerHTML = '<span class="todo-column-title">' + escapeHtml(colName) + '</span>' +
        '<span class="todo-column-count">' + items.length + '</span>';
      colEl.appendChild(headerEl);

      var listEl = document.createElement('div');
      listEl.className = 'todo-column-items';

      for (var m = 0; m < items.length; m++) {
        listEl.appendChild(renderCard(items[m]));
      }

      colEl.appendChild(listEl);
      dom.board.appendChild(colEl);
    }
  }

  function renderCard(item) {
    var card = document.createElement('div');
    card.className = 'todo-item';
    card.dataset.id = item.id;

    var titleText = escapeHtml(item.title);
    if (item.url) {
      titleText = '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer">' + titleText + '</a>';
    }

    var bodyPreview = item.body ? escapeHtml(item.body.substring(0, 120)) : '';
    if (item.body && item.body.length > 120) bodyPreview += '...';

    card.innerHTML = '<div class="todo-item-title">' + titleText + '</div>' +
      (bodyPreview ? '<div class="todo-item-body">' + bodyPreview + '</div>' : '') +
      (state.token ? '<div class="todo-item-actions">' +
        '<button class="todo-btn todo-btn-small todo-edit-btn" data-id="' + item.id + '">Edit Status</button>' +
        '<button class="todo-btn todo-btn-small todo-btn-danger todo-delete-btn" data-id="' + item.id + '">Delete</button>' +
        '</div>' : '');

    return card;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // --- Error / Loading ---
  function showError(msg) {
    dom.loading.style.display = 'none';
    dom.errorMsg.textContent = msg;
    dom.error.style.display = 'flex';
  }

  function showLoading() {
    dom.loading.style.display = 'flex';
    dom.error.style.display = 'none';
    dom.board.innerHTML = '';
  }

  function hideLoading() {
    dom.loading.style.display = 'none';
  }

  // --- Init ---
  async function initAuthed() {
    showLoading();
    try {
      state.user = await fetchUserInfo();
      showLoggedIn(state.user);
      await fetchProjectData();
      hideLoading();
      renderBoard();
    } catch (e) {
      hideLoading();
      if (e.message && e.message.indexOf('401') !== -1) {
        logout();
        showError('Session expired. Please sign in again.');
      } else {
        showError('Failed to load project: ' + e.message);
      }
    }
  }

  async function init() {
    if (state.token) {
      await initAuthed();
    } else {
      dom.loading.style.display = 'none';
      showLoggedOut();
    }
  }

  // --- Event Handlers ---
  dom.loginBtn.addEventListener('click', startDeviceFlow);

  dom.deviceCancel.addEventListener('click', function () {
    if (state.devicePollTimer) {
      clearInterval(state.devicePollTimer);
      state.devicePollTimer = null;
    }
    dom.deviceModal.style.display = 'none';
  });

  dom.retryBtn.addEventListener('click', function () {
    dom.error.style.display = 'none';
    if (state.token) {
      initAuthed();
    } else {
      init();
    }
  });

  dom.addBtn.addEventListener('click', function () {
    state.editingItem = null;
    dom.itemModalTitle.textContent = 'Add Item';
    dom.itemTitle.value = '';
    dom.itemBody.value = '';
    dom.statusGroup.style.display = 'none';
    dom.itemModal.style.display = 'flex';
    dom.itemTitle.focus();
  });

  dom.itemCancel.addEventListener('click', function () {
    dom.itemModal.style.display = 'none';
  });

  dom.itemForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var title = dom.itemTitle.value.trim();
    if (!title) return;

    var body = dom.itemBody.value.trim();

    dom.itemModal.style.display = 'none';

    try {
      if (state.editingItem) {
        // Update status
        var optionId = dom.itemStatus.value;
        if (optionId) {
          await updateItemStatus(state.editingItem.id, optionId);
        }
      } else {
        // Add new item
        await addDraftIssue(title, body);
      }
      // Refresh
      showLoading();
      await fetchProjectData();
      hideLoading();
      renderBoard();
    } catch (err) {
      showError('Operation failed: ' + err.message);
    }
  });

  // Event delegation for card buttons
  dom.board.addEventListener('click', async function (e) {
    var editBtn = e.target.closest('.todo-edit-btn');
    var deleteBtn = e.target.closest('.todo-delete-btn');

    if (editBtn) {
      var itemId = editBtn.dataset.id;
      var item = state.items.find(function (i) { return i.id === itemId; });
      if (!item) return;

      state.editingItem = item;
      dom.itemModalTitle.textContent = 'Edit Status';
      dom.itemTitle.value = item.title;
      dom.itemTitle.disabled = true;
      dom.itemBody.value = item.body;
      dom.itemBody.disabled = true;

      // Populate status select
      dom.itemStatus.innerHTML = '';
      for (var i = 0; i < state.statusOptions.length; i++) {
        var opt = state.statusOptions[i];
        var optEl = document.createElement('option');
        optEl.value = opt.id;
        optEl.textContent = opt.name;
        if (opt.id === item.statusOptionId) optEl.selected = true;
        dom.itemStatus.appendChild(optEl);
      }
      dom.statusGroup.style.display = 'block';
      dom.itemModal.style.display = 'flex';
    }

    if (deleteBtn) {
      var delItemId = deleteBtn.dataset.id;
      if (!confirm('Delete this item?')) return;
      try {
        await deleteItem(delItemId);
        showLoading();
        await fetchProjectData();
        hideLoading();
        renderBoard();
      } catch (err) {
        showError('Delete failed: ' + err.message);
      }
    }
  });

  // Close modals on overlay click
  [dom.deviceModal, dom.itemModal].forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        if (modal === dom.deviceModal && state.devicePollTimer) {
          clearInterval(state.devicePollTimer);
          state.devicePollTimer = null;
        }
      }
    });
  });

  // Re-enable fields when modal closes (for next use)
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.target === dom.itemModal && dom.itemModal.style.display === 'none') {
        dom.itemTitle.disabled = false;
        dom.itemBody.disabled = false;
      }
    });
  });
  observer.observe(dom.itemModal, { attributes: true, attributeFilter: ['style'] });

  // --- Start ---
  init();
})();
