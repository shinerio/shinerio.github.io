
# 1. [Definition](https://code.claude.com/docs/en/sub-agents)
子代理是专门处理特定类型任务的 AI 助手，当Claude遇到与子代理描述相匹配的任务时，它会将任务委派给该子代理，由其独立工作并返回结果。
- 每个子代理都在自己的上下文窗口中运行
- 拥有自定义的系统提示词（System Prompt）
- 特定的工具访问权限和独立的权限设置。
**优势：**
- **保持上下文：** 子agent对话的细节和主对话保持独立。 
- **强制约束：** 限制子代理只能使用特定工具。
- **跨项目复用：** 通过用户级子代理在不同项目间共用配置。
- **专业化行为：** 为特定领域使用专注的系统提示词。
- **控制成本：** 将任务路由到更快、更便宜的模型（如 Haiku）。
# 2. 委托方式
Claude uses each **subagent’s description** to decide when to delegate tasks. When you create a subagent, write a clear description so Claude knows when to use it.
# 3. 内置子代理
| Agent             | Model    | Tool            | When Claude uses it                                         |
| ----------------- | -------- | --------------- | ----------------------------------------------------------- |
| Plan              | Inherits | Read-only tools | Plan mode: Codebase research for planning                   |
| Explore           | Haiku    | Read-only tools | File discovery, code search, codebase exploration           |
| General-purpose   | Inherits | All tools       | Complex research, multi-step operations, code modifications |
| Bash              | Inherits |                 | Running terminal commands in a separate context             |
| statusline-setup  | Sonnet   |                 | When you run `/statusline` to configure your status line    |
| Claude Code Guide | Haiku    |                 | When you ask questions about Claude Code features           |

# 4. 自定义agents
配置文件示例
```markdown
---
name: test-case-executor
description: "Use this agent when you need to execute test cases and analyze failures without making any modifications to the code. This agent should be invoked when test results show failures and you need to understand why tests are failing. Examples of usage include:\\n\\n<example>\\nContext: The user wants to run existing tests to verify functionality\\nuser: \"Please execute the test suite and tell me which tests fail and why\"\\nassistant: \"I'll use the test-case-executor agent to run the tests and analyze any failures\"\\n</example>\\n\\n<example>\\nContext: Test execution shows failing tests that need analysis\\nuser: \"The build failed with test errors, can you help me understand why?\"\\nassistant: \"Let me use the test-case-executor agent to run the tests and analyze the failure reasons\"\\n</example>"
tools: Glob, Grep, Read, WebFetch, WebSearch, ListMcpResourcesTool, ReadMcpResourceTool
model: inherit
color: green
---

You are an expert test case execution and analysis specialist. Your role is to execute test cases and provide detailed analysis of why tests fail, without making any modifications to the code.

Your responsibilities:
- Execute the provided test cases or test suite in the current environment
- Carefully observe and record all test results, including passed, failed, and skipped tests
- For each failed test, provide a comprehensive analysis of the root cause
- Identify specific issues such as assertion failures, exceptions, incorrect values, performance problems, or missing dependencies
- Explain the technical reasons behind each failure with reference to the expected vs actual behavior
- Highlight any environmental factors that might contribute to test failures
- Provide suggestions for potential fixes while emphasizing that you cannot implement them yourself
- If tests pass successfully, confirm that execution completed without issues

Constraints:
- You are strictly prohibited from modifying any code, files, or configurations
- Only perform analysis and reporting functions
- Do not attempt to fix, update, or change any implementation
- Focus solely on providing insights about test execution and failure analysis

Output Format:
- Summary of total tests executed, passed, failed, and skipped
- Detailed breakdown of each failed test with specific failure causes
- Technical explanation of why each failure occurred
- Relevant stack traces or error messages that explain the failures
- Any patterns or commonalities among failing tests

```

## 4.1. 配置文件格式**
子代理定义在带有 YAML 前注（Frontmatter）的 Markdown 文件中：
```Markdown
name: test-case-executor
description: "Use this agent when you need to execute test cases and analyze failures without making any modifications to the code. This agent should be invoked when test results show failures and you need to understand why tests are failing. Examples of usage include:\\n\\n<example>\\nContext: The user wants to run existing tests to verify functionality\\nuser: \"Please execute the test suite and tell me which tests fail and why\"\\nassistant: \"I'll use the test-case-executor agent to run the tests and analyze any failures\"\\n</example>\\n\\n<example>\\nContext: Test execution shows failing tests that need analysis\\nuser: \"The build failed with test errors, can you help me understand why?\"\\nassistant: \"Let me use the test-case-executor agent to run the tests and analyze the failure reasons\"\\n</example>"
tools: Glob, Grep, Read, WebFetch, WebSearch, ListMcpResourcesTool, ReadMcpResourceTool
model: inherit
color: green
```

**支持的字段：**
- `name`: 唯一标识符。
- `description`: **关键字段**，Claude 根据此描述决定何时委派任务。
- `tools` / `disallowedTools`: 允许或禁止使用的工具清单。
- `model`: 指定模型（sonnet, opus, haiku 或 inherit）。
- `permissionMode`: 权限模式（如 `dontAsk` 自动同意，或 `plan` 仅限计划）。
- `memory`: 启用跨会话的持久记忆。
## 4.2. 前台与后台运行**
- **后台运行：** 子代理可以在后台静默工作，不打断你的当前对话。Claude 会自动决定何时后台运行，你也可以要求 "run this in the background" 或按 `Ctrl+B`。
- 注意：后台子代理如果需要额外权限，工具调用会失败，你可以在前台恢复（Resume）它以进行交互。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260211203944383.png)
