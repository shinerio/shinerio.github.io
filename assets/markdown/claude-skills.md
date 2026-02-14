# 1. 原理
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202512282218859.png)
claude skill是一类**模块化能力组件**，用于拓展 Claude的功能边界。每项技能都封装了：
1. 元数据
2. 指令说明
3. 可选配套资源（脚本、模板）
Claude Agent Skills的设计哲学在于**模块化与按需加载**，旨在解决传统代理系统中常见的上下文冗余、性能衰减以及操作不可控等痛点 。其核心原理可以概括为基于虚拟文件系统的“渐进式披露”机制，避免在会话开始时向模型注入过多的无关信息，该过程被严格划分为三个层级，确保模型仅在必要时加载信息。

**渐进式披露（Progressive Disclosure）的三层模型**

| **披露层级**                   | **载入内容**              | **对上下文的影响**         | **操作阶段**  |
| -------------------------- | --------------------- | ------------------- | --------- |
| **第一级：元数据（Metadata）**      | 技能名称、描述、YAML 头部信息     | 每个技能约占用 100 个 Token | 发现与启动阶段   |
| **第二级：指令主体（Instructions）** | `SKILL.md` 文件的全文      | 通常小于 5,000 个 Token  | 激活与触发阶段   |
| **第三级：扩展资源（Resources）**    | 关联的脚本、辅助 Markdown、架构图 | 根据执行需求动态按需加载        | 执行与深度作业阶段 |
1. 在初始阶段，模型仅通过预加载的元数据识别技能的存在 。
2. 当用户的意图与技能描述匹配时，模型主动调用工具读取 `SKILL.md`，此时才将具体的 SOP（标准作业程序）引入上下文 。
3. 如果任务进一步深入，模型会根据 `SKILL.md` 中的引用，访问特定目录下的脚本或文档
> 这种“按需加载”的模式避免了过多无效信息的干扰，极大提升了长对话中的模型响应质量

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202512282218859.png)

## 1.1. Use Skills with subagents
[Subagents](https://code.claude.com/docs/en/sub-agents) do not automatically inherit Skills from the main conversation. To give a custom subagent access to specific Skills, list them in the subagent’s `skills` field in `.claude/agents/`:
```
# .claude/agents/code-reviewer/AGENT.md
---
name: code-reviewer
description: Review code for quality and best practices
skills: pr-review, security-check
---
```

The listed Skills are loaded into the subagent’s context when it starts. If the `skills` field is omitted, no Skills are preloaded for that subagent.
## 1.2. 模型驱动的语义触发与决策机制
技能的调用并非基于传统的硬编码规则或简单的关键词匹配，而是由 LLM 自身的推理能力驱动 。系统中不存在独立的意图分类器或基于向量检索的预置逻辑；相反，系统将所有可用技能的元数据格式化后嵌入到模型的初始环境中，由模型根据自然语言理解自行决定是否调用某个特定的技能 。
这一决策链条始于语义匹配。当模型判定用户请求（如“帮我生成一份财务报告”）与某个技能（如 `xlsx` 技能）的描述（如“生成并分析 Excel 电子表格”）高度相关时，它会触发该技能的加载 。这种推理驱动的模式赋予了Agent Skills极高的灵活性，使其能够处理具有模糊性或复杂层级的任务，而无需开发者手动编写复杂的逻辑路由 。
# 2. 插件安装
官方提供的两个技能插件
```shell
/plugin install document-skills@anthropic-agent-skills
> 
/plugin install example-skills@anthropic-agent-skills
```
- **document-skills**：文档技能包，可以处理 Excel、Word、PPT、PDF 等文档。
- **example-skills**：示例技能包 ，可以处理技能创建、MCP 构建、视觉设计、算法艺术、网页测试、Slack 动图制作、主题样式等。
对于开发者而言，Claude Code 提供了最直观的技能管理方式。在这一环境下，技能被视为文件系统中的特定资产，具有清晰的作用域划分 。   
- **个人技能（Personal Skills）**：存储在用户主目录下的 `~/.claude/skills/` 路径中。这些技能对该用户在当前机器上的所有项目生效，适用于个人习惯和跨项目的工作流 。   
- **项目技能（Project Skills）**：存储在项目根目录的 `.claude/skills/` 中。这些技能通常随代码库一起提交到版本控制系统（如 Git），确保团队所有成员在使用 Claude Code 进行项目协作时，拥有完全一致的领域背景和工具支持 。  
- **插件技能（Plugin Skills）**：作为 Claude Code 插件的一部分进行分发 。用户可以通过内置的插件市场安装预制的技能包，例如针对特定框架（如 React 或 FastAPI）的开发技能 。
# 3. 自定义开发
```example
pdf-skill/
├── SKILL.md (main instructions)
├── FORMS.md (form-filling guide)
├── REFERENCE.md (detailed API reference)
└── scripts/
    └── fill_form.py (utility script)
```
# 4. ref
[Anthropic claude skills](https://github.com/anthropics/skills)
[Agent skils overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
[gemini deep research](https://docs.google.com/document/d/1Cgct4ubrHPnl_7qp5jk-1JaPzmsGG82RldBPirg1-Mw/edit?tab=t.0)
