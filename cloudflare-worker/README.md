# Cloudflare Worker OAuth Proxy

这个Worker作为GitHub OAuth Device Flow的CORS代理，用于TODO功能的身份验证。

## 部署步骤

### 1. 安装Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录Cloudflare（首次使用）

```bash
wrangler login
```

这会打开浏览器，要求你登录Cloudflare账号并授权。

### 3. 部署Worker

```bash
cd cloudflare-worker
wrangler deploy
```

### 4. 获取Worker URL

部署成功后，控制台会显示Worker的URL，格式类似：
```
https://github-oauth-proxy.YOUR-SUBDOMAIN.workers.dev
```

### 5. 更新配置

将Worker URL更新到 `blog.config.json` 中：

```json
{
  "todo": {
    "enabled": true,
    "projectNumber": 4,
    "repo": "TODO",
    "oauthClientId": "Ov23li65mtWdX973c2zm",
    "oauthProxyUrl": "https://github-oauth-proxy.YOUR-SUBDOMAIN.workers.dev"
  }
}
```

### 6. 重新生成博客

```bash
npm run build
npx obsidian-blog generate
```

### 7. 部署到GitHub Pages

```bash
# Windows
deploy.bat -d github

# Linux/macOS
./deploy.sh -d github
```

## Worker代码说明

Worker提供两个endpoint：

- `POST /device/code` - 启动GitHub Device Flow，获取设备码
- `POST /access_token` - 轮询获取访问令牌

Worker会转发请求到GitHub OAuth API并添加CORS头，使浏览器可以直接调用。

## 测试Worker

部署后，可以使用curl测试：

```bash
# 测试device code endpoint
curl -X POST https://your-worker.workers.dev/device/code \
  -H "Content-Type: application/json" \
  -d '{"client_id":"YOUR_CLIENT_ID","scope":"project"}'

# 应该返回包含user_code和device_code的JSON
```

## 故障排查

### Worker返回404
- 检查Worker是否成功部署：`wrangler deployments list`
- 确认URL拼写正确
- 确认使用了正确的subdomain

### Worker返回403
- 检查Cloudflare账户状态
- 确认Worker服务已启用

### OAuth失败
- 确认GitHub OAuth App已创建并启用Device Flow
- 检查Client ID是否正确
- 查看浏览器控制台的详细错误信息
