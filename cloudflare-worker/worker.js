// 允许的来源域名（仅你的网站）
const ALLOWED_ORIGINS = [
  'https://shinerio.site',
  'https://www.shinerio.site',
  'http://localhost:8080',  // 本地开发
];

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer') || '';

    // 安全检查：验证来源
    if (!isAllowedOrigin(origin, referer)) {
      return new Response('Forbidden', { status: 403 });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    let target;

    if (url.pathname === '/device/code') {
      target = 'https://github.com/login/device/code';
    } else if (url.pathname === '/access_token') {
      target = 'https://github.com/login/oauth/access_token';
    } else {
      return new Response('Not found', { status: 404 });
    }

    // 验证并过滤请求体
    let body;
    try {
      const rawBody = await request.text();
      const data = JSON.parse(rawBody);

      // 只允许必要的字段，防止注入攻击
      const sanitized = sanitizeRequestBody(url.pathname, data);
      body = JSON.stringify(sanitized);
    } catch (e) {
      return new Response('Invalid request body', { status: 400 });
    }

    const resp = await fetch(target, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body
    });

    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
    });
  }
};

/**
 * 验证来源是否被允许
 */
function isAllowedOrigin(origin, referer) {
  // 检查 Origin header
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // 检查 Referer header (备用，当 Origin 不存在时)
  if (referer) {
    for (const allowedOrigin of ALLOWED_ORIGINS) {
      if (referer.startsWith(allowedOrigin + '/')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 清理请求体，只保留必要字段
 */
function sanitizeRequestBody(pathname, data) {
  if (pathname === '/device/code') {
    return {
      client_id: data.client_id,
      scope: data.scope || 'public_repo'
    };
  } else if (pathname === '/access_token') {
    return {
      client_id: data.client_id,
      device_code: data.device_code,
      grant_type: data.grant_type
    };
  }
  return data;
}

/**
 * CORS headers（限制为特定 Origin）
 */
function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'  // 预检请求缓存 24 小时
  };
}
