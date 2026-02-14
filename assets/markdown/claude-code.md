# 1. claude code配置
## 1.1. ide集成
在vscode中安装claude code插件，然后在claude code命令行界面使用`/idea`即可连接到vscode。claude code就可以和vscode进行交付，感知你在vscode中选中的代码、文件，claude code的修改也会在vscode中以diff形式呈现。
## 1.2. 使用vscode作为输入编辑器
```
$env:EDITOR = "code --wait"
```
## 1.3. 切换provider
**方案一**：使用[cc-switch](https://github.com/farion1231/cc-switch)
**方案二**：claude-code-router
```
# 将claude code路由至其他大模型提供商
npm install -g @musistudio/claude-code-router
#安装阿里云百炼的config
npm install -g @dashscope-js/claude-code-config
# power shell开启执行命令权限
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# 配置ali key
ccr-dashscope
# 启动，启动命令执行的路径要和vscode准备打开的项目路径一致
ccr code
```
# 2. [常用命令](https://code.claude.com/docs/zh-CN/cli-reference)

| 命令                  | 功能                                                 | 示例                                  |
| ------------------- | -------------------------------------------------- | ----------------------------------- |
| `claude`            | 启动交互模式                                             | `claude`                            |
| `claude "task"`     | 运行一次性任务                                            | `claude "fix the build error"`      |
| `claude -p "query"` | 运行一次性查询，然后退出                                       | `claude -p "explain this function"` |
| `claude -c`         | 继续最近的对话                                            | `claude -c`                         |
| `claude -r`         | 恢复之前的对话                                            | `claude -r`                         |
| `claude commit`     | 创建 Git 提交                                          | `claude commit`                     |
| `/clear`            | 清除对话历史                                             | `> /clear`                          |
| `/help`             | 显示可用命令                                             | `> /help`                           |
| `exit` 或 Ctrl+C     | 退出 Claude Code                                     | `> exit`                            |
| `/export`           | 把**当次对话**复制到剪贴板，便于**归档**或**交叉验证**（例如贴给 GPT 审核推理链）。 |                                     |

# 3. 使用技巧
`/init` claude code会分析当前文件夹，把它学到的关于项目的知识记录在根目录下CLAUDE.md里。当然，我们也可以手动修改这个文件，把我们认为的一些重要信息（提示、约束等）放到里面。

`/commpact` 压缩

`/clear` 清楚会话记录，开启一个新工程的应该使用

`think  < think hard < think harder < ultrathink`
思考等级逐级递增，ultrathink可以用来思考一些比较难的问题

`!`可以临时执行命令行，并将执行结果作为后续上下文

输入`#`号进入记忆模式，
```
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
# Add to memory. Try "Always use descriptive variable names"
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  # to memorize
```
可以选择存放位置
- 用户级别：所有项目都会生效
- 项目
```
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
# 所有代码都需要经过严格测试
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                                                      │
│ Select memory file to edit:                                                                                          │
│                                                                                                                      │
│  ❯ 1. User memory      Saved in ~/.claude/CLAUDE.md                                                                  │
│    2. Project memory   Saved in ./CLAUDE.md                                                                          │
│                                                                                                                      │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
``` 

`/permissions` 添加工具或者命令，允许自动执行

`claude --dangerously-skip-permissions` 赋予claude code最高权限，可以自动执行任何命令

subagent可以让claude在后台开启多个子任务，并行执行。`/agents`

## 3.1. [导出会话历史](https://github.com/ZeroSumQuant/claude-conversation-extractor)
```shell
uv tool install claude-conversation-extractor
claude-start
```
## 3.2. 快捷键
https://code.claude.com/docs/en/interactive-mode
# 4. claudia
可视化界面
# 5. mcp安装
本地安装
`claude mcp add [alias] -- npx @upstash/context7-mcp`
remote http
`claude mcp add --transport http`
sse transport
`claude mcp add --transport sse`

```shell
# 卸载
claude mcp remove context7
```

项目级别，仅在当前项目下生效
`claude mcp add context7 -- npx @upstash/context7-mcp`
用户级别的，所有项目生效
`claude mcp add context7 --scope user -- npx @upstash/context7-mcp`
使用`/mcp`命令可以进行mcp管理

# 6. 用量查询
| **命令**         | **核心作用**                                                        | **适用人群**           | **典型场景**                            |
| -------------- | --------------------------------------------------------------- | ------------------ | ----------------------------------- |
| **`/context`** | **查看当前会话的上下文占用**。显示已用 token 数、剩余空间以及距离“自动压缩（Auto-compact）”还有多远。 | **所有人**            | 感觉 Claude 开始“忘事”或变慢时，确认上下文窗口是否快满了。  |
| **`/usage`**   | **查看 Pro/Max 订阅计划的限制**。显示当前时间段内剩余的消息配额或 Token 限额，以及重置时间。        | **订阅用户** (Pro/Max) | 担心触发“每 5 小时限额”时，检查还能发多少消息。          |
| **`/cost`**    | **查看 API 费用的实时统计**。显示当前会话产生的美元开销、Input/Output/Cache 的具体消耗。      | **API 用户** (按量付费)  | 关注钱包，想知道刚才那个复杂的重构任务花了几美分。           |
| **`/stats`**   | **查看历史使用习惯和性能**。显示总计消息数、工具使用频率（如读了多少次文件）、最常调用的代理等。              | **所有人**            | 想回顾在这个项目中一共让 Claude 干了多少活，或者分析性能瓶颈。 |

# 7. Mind Map
![mindmap](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/claude_code_mindmap.html.png)
