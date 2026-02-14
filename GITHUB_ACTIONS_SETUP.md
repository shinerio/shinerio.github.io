# GitHub Actions 自动部署配置指南

本指南将帮助你配置 GitHub Actions，实现博客的自动部署。

## 工作流说明

已创建两个工作流：

1. **deploy.yml** - 主部署工作流
   - 当博客代码 push 到 master 分支时触发
   - 每小时自动检查并部署一次（确保笔记更新能被同步）
   - 支持手动触发

2. **trigger-from-notes.yml** - 笔记更新即时触发（可选）
   - 通过 repository_dispatch 事件触发
   - 需要在 obsidian 仓库配置触发器（见下文）

## 必需配置步骤

### 1. 创建 GitHub Personal Access Token

访问笔记仓库需要一个具有访问权限的 token。

1. 访问 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - 直接链接: https://github.com/settings/tokens

2. 点击 "Generate new token" → "Generate new token (classic)"

3. 配置 token:
   - **Note**: `Obsidian Blog Deploy`
   - **Expiration**: 选择 "No expiration" 或根据需要设置
   - **Scopes**: 勾选以下权限
     - ✅ `repo` (完整仓库访问权限)

4. 点击 "Generate token"

5. **重要**: 复制生成的 token（格式类似 `ghp_xxxxxxxxxxxx`），稍后将用到

### 2. 在博客仓库配置 Secret

1. 打开博客仓库: https://github.com/shinerio/shinerio.github.io

2. 进入 Settings → Secrets and variables → Actions

3. 点击 "New repository secret"

4. 配置 secret:
   - **Name**: `OBSIDIAN_REPO_TOKEN`
   - **Secret**: 粘贴刚才生成的 Personal Access Token

5. 点击 "Add secret"

### 3. 启用 GitHub Pages

1. 在博客仓库进入 Settings → Pages

2. 在 "Build and deployment" 部分:
   - **Source**: 选择 "GitHub Actions"

3. 保存设置

### 4. 验证部署

配置完成后，你可以通过以下方式触发部署：

1. **自动触发**: 推送代码到 master 分支
   ```bash
   git add .
   git commit -m "Enable GitHub Actions deployment"
   git push
   ```

2. **手动触发**:
   - 访问仓库的 Actions 标签
   - 选择 "Deploy Blog to GitHub Pages"
   - 点击 "Run workflow"

3. **查看部署状态**:
   - 访问 Actions 标签查看工作流运行状态
   - 绿色勾号表示部署成功
   - 部署完成后访问 https://shinerio.site 查看博客

## 可选配置：从笔记仓库即时触发部署

如果你希望在 obsidian 仓库 push 时立即触发博客部署（而不是等待定时任务），可以按以下步骤配置：

### 1. 创建另一个 Personal Access Token

1. 访问 https://github.com/settings/tokens

2. 生成新 token:
   - **Note**: `Trigger Blog Deploy`
   - **Expiration**: No expiration 或自定义
   - **Scopes**:
     - ✅ `repo` (需要触发其他仓库的 workflow)

3. 复制生成的 token

### 2. 在 obsidian 仓库配置 Secret

1. 打开 obsidian 仓库: https://github.com/shinerio/obsidian

2. 进入 Settings → Secrets and variables → Actions

3. 添加 secret:
   - **Name**: `BLOG_REPO_TOKEN`
   - **Secret**: 粘贴刚才生成的 token

### 3. 在 obsidian 仓库创建触发工作流

在 obsidian 仓库创建 `.github/workflows/trigger-blog.yml`:

```yaml
name: Trigger Blog Deployment

on:
  push:
    branches:
      - main  # 或你的默认分支名称

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger blog deployment
        run: |
          curl -X POST \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer ${{ secrets.BLOG_REPO_TOKEN }}" \
            https://api.github.com/repos/shinerio/shinerio.github.io/dispatches \
            -d '{"event_type":"notes-updated"}'
```

配置完成后，每次向 obsidian 仓库推送更新时，都会自动触发博客重新部署。

## 故障排查

### 工作流失败

1. 检查 Actions 标签页的错误日志
2. 常见问题:
   - `OBSIDIAN_REPO_TOKEN` secret 未配置或过期
   - Token 权限不足（需要 `repo` 权限）
   - Node.js 版本不兼容

### GitHub Pages 未更新

1. 确认 Actions 工作流运行成功（绿色勾号）
2. GitHub Pages 部署可能需要几分钟
3. 检查 Settings → Pages 确认使用 "GitHub Actions" 作为源

### 自定义域名问题

1. 确认 `blog.config.json` 中的 `customDomain` 配置正确
2. 检查域名的 DNS 配置是否正确
3. GitHub Pages 需要时间验证域名（可能需要几小时）

## 工作流定制

### 修改部署频率

编辑 `.github/workflows/deploy.yml`，修改 `schedule` 部分：

```yaml
schedule:
  - cron: '0 */2 * * *'  # 每2小时运行一次
  - cron: '0 0 * * *'    # 每天午夜运行一次
```

Cron 表达式格式: `分 时 日 月 星期`

### 禁用定时部署

如果配置了从 obsidian 仓库即时触发，可以删除 `deploy.yml` 中的 `schedule` 部分。

## 安全建议

1. 定期更换 Personal Access Token
2. 使用最小权限原则，只授予必要的权限
3. 妥善保管 token，不要提交到代码仓库
4. 考虑为 token 设置过期时间

## 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [Personal Access Token 管理](https://github.com/settings/tokens)
