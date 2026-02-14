# 文章日期处理说明

## 日期优先级

博客生成器在确定文章日期时，遵循以下优先级顺序：

### 1. YAML Front Matter 中的 `date` 字段（最高优先级）

在 Markdown 文件的 YAML frontmatter 中显式声明日期：

```markdown
---
title: 我的文章
date: 2024-01-15
tags: [技术, 教程]
---

文章内容...
```

支持的日期格式：
- `YYYY-MM-DD`（推荐）：2024-01-15
- ISO 8601：2024-01-15T10:30:00Z
- 任何 JavaScript `Date` 构造函数支持的格式

### 2. Git 第一次 commit 时间（次优先级）

如果 frontmatter 中没有声明 `date` 字段，博客生成器会自动从 Git 历史中提取该文件的**第一次 commit 时间**。

这个功能特别适合：
- 从其他平台迁移的旧文章
- 已经在 Git 仓库中管理的笔记
- 保持文章的真实创建时间

**工作原理**：
```bash
# 博客生成器内部执行的命令
git log --follow --format=%aI --reverse -- <filepath>
```

该命令：
- `--follow`：跟踪文件重命名历史
- `--format=%aI`：输出 ISO 8601 格式的作者时间
- `--reverse`：从最早到最新排序
- 取第一条记录作为文章创建时间

### 3. 文件系统时间（最低优先级）

如果以上两种方式都无法获取日期（例如文件不在 Git 仓库中），则使用文件系统的创建时间（`birthtime`），如果创建时间不可用，则使用修改时间（`mtime`）。

## 示例场景

### 场景 1：迁移旧文章

你有一篇写于 2020 年的文章，但刚刚推送到 GitHub：

```markdown
---
title: 我的第一篇技术博客
date: 2020-03-15
---

这是我 2020 年写的文章...
```

**结果**：文章日期显示为 2020-03-15（来自 frontmatter）

### 场景 2：Obsidian 笔记转博客

你的 Obsidian 笔记没有 date 字段，但已经在 Git 仓库中管理了一年：

```markdown
---
title: TypeScript 学习笔记
tags: [TypeScript, 编程]
---

笔记内容...
```

假设该文件的第一次 Git commit 是 2023-06-10，**结果**：文章日期显示为 2023-06-10（来自 Git 历史）

### 场景 3：本地新建文章

你刚刚创建了一个新文件，还没有 Git commit：

```markdown
---
title: 今天的想法
---

今天的内容...
```

**结果**：文章日期显示为文件创建时间（来自文件系统）

## 兼容性说明

### `created` 字段兼容

为了兼容其他 Markdown 编辑器，博客生成器同时支持 `created` 字段作为 `date` 的替代：

```markdown
---
title: 我的文章
created: 2024-01-15
---
```

**优先级**：`date` > `created` > Git commit 时间 > 文件系统时间

### 非 Git 仓库兼容

如果你的笔记目录不是 Git 仓库，或者 Git 命令执行失败，博客生成器会自动回退到文件系统时间，不会中断生成过程。

## 最佳实践

1. **新文章**：在 frontmatter 中显式声明 `date` 字段
2. **旧文章迁移**：如果有准确的创建日期，添加 `date` 字段；否则依赖 Git 历史
3. **Git 管理笔记**：确保笔记在 Git 仓库中，首次提交时间会被自动使用
4. **日期格式**：推荐使用 `YYYY-MM-DD` 格式，清晰且易于阅读

## 技术实现

相关代码：`src/core/MetadataParser.ts`

```typescript
// 日期提取优先级
private extractDate(data: any, defaultDate: Date): Date {
  // 优先级1: frontmatter.date
  if (data.date) {
    const date = new Date(data.date);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // 优先级2: frontmatter.created（兼容性）
  if (data.created) {
    const date = new Date(data.created);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // 优先级3: defaultDate（Git commit 时间 > 文件系统时间）
  return defaultDate;
}

// Git commit 时间提取
private getGitFirstCommitDate(filePath: string): Date | null {
  try {
    const output = execSync(
      `git log --follow --format=%aI --reverse -- "${filePath}"`,
      { encoding: 'utf-8', timeout: 5000 }
    ).trim();

    if (output) {
      const firstCommitDate = output.split('\n')[0];
      return new Date(firstCommitDate);
    }
  } catch {
    // 静默失败，回退到文件系统时间
  }
  return null;
}
```

## 故障排查

### 问题：文章日期不准确

**解决方案**：
1. 检查 frontmatter 中是否有 `date` 或 `created` 字段
2. 验证日期格式是否正确（推荐 `YYYY-MM-DD`）
3. 检查文件是否在 Git 仓库中：`git log --follow -- <文件路径>`

### 问题：Git 命令超时

如果仓库非常大，Git 命令可能超时（默认 5 秒）。博客生成器会自动回退到文件系统时间，不会影响生成过程。

### 问题：文件被重命名导致日期丢失

不用担心！Git 命令使用 `--follow` 参数，会自动跟踪文件重命名历史。
