 A "change" in [OpenSpec](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md)是一个“承载着围绕一项工作所进行的所有思考和规划的“集合。文件夹位于`openspec/changes/<name>/`，包含proposal, specs, design, tasks。
 工作流程
 ```
┌────────────────────┐
│ Start a Change     │  /opsx:new
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Create Artifacts   │  /opsx:ff or /opsx:continue
│ (proposal, specs,  │
│  design, tasks)    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Implement Tasks    │  /opsx:apply
│ (AI writes code)   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Archive & Merge    │  /opsx:archive
│ Specs              │
└────────────────────┘
 ```
目录结构
```text
openspec/
├── specs/              # 系统的“事实来源”（Source of Truth）
│   └── <domain>/       # 按领域划分（如 auth, payments）
│       └── spec.md     # 当前系统的行为描述
├── changes/            # 正在进行的变更请求（每个变更一个文件夹）
│   └── <change-name>/
│       ├── proposal.md        ← Why we're doing this（目的与范围）
│       ├── design.md          ← How we'll build it（技术设计与架构方案）
│       ├── tasks.md           ← Implementation checklist（待办事项）
│       └── specs/      # Delta specs (what's changing, ADDED/MODIFIED/REMOVED requirements) 
│           └── <domain>/
│               └── spec.md    ← Detailed requirements
└── config.yaml         # Project configuration (optional)
```
- **`specs/`** - 这是最重要的目录，存储了系统当前是如何运行的完整描述。
	- **按domain组织**：为了防止单个文档过大，它按功能领域（Domain）划分子文件夹（例如 specs/auth/、specs/ui/）。
	- **持久性**：这里的文档代表了系统的现状，是所有 AI 编码助手理解项目逻辑的基础。
- **`changes/`** -每当你想要添加新功能或修复 Bug 时，都会在这里创建一个子文件夹（通过 `/opsx:new` 命令）。
	- **隔离性**：每个变更都在独立的文件夹中进行，互不干扰。
	- **关键工件（Artifacts）**：
		1. **`proposal.md` (提案)**：解释“为什么”要做这个改动，明确意图、范围和方案。
		2. **`specs/` (Delta Specs/增量规范)**：这是OpenSpec的核心。它不记录全部规范，只记录增加（ADDED）、修改（MODIFIED）或删除（REMOVED）了哪些需求。
		3. **`design.md` (设计)**：描述具体的“技术实现方式”，如架构决策、数据库改动等。
		4. **`tasks.md` (任务)**：一份自动生成的、可勾选的实现清单，AI 会根据这个清单来编写代码（通过 `/opsx:apply`）。
# 1. exploer
当需求不明确或者需要进行深入调研（性能优化、架构选型）时，可以使用`/opsx:explore`命令和LLM对话来细化我们想要做什么`Change`
# 2. proposal
- 为什么要做这个变更
- 这个变更大概包含什么
```
## 1.1. Why 
1-2句话解释背景

## 1.2. What Changes
变更要点

## 1.3. Capabilities

### 1.3.1. New Capabilities
- `<capability-name>`: [brief description]

### 1.3.2. Modified Capabilities
<!-- If modifying existing behavior -->

## 1.4. Impact
- `src/path/to/file.ts`: [what changes]
- [other files if applicable]
```

# 3. spec(类似requirements.md)
规格说明书以精确、可测试的方式定义了我们要构建的内容。它们采用需求/场景格式，使预期行为一目了然。
![[SDD（Spec-Driven-Develop）#1. 需求文档]]
# 4. Design
Design阐明了我们将如何构建系统——包括技术决策、权衡取舍和具体方法。对于一些小的改动，设计方案可能比较简短。
# 5. Task
Task将工作分解为具体的实施任务——这些任务以复选框的形式呈现，用于指导后续的执行阶段。这些任务应该简短、清晰，并且按逻辑顺序排列。
# 6. Archieve
```
You: /opsx:archive

AI:  Archiving add-dark-mode...
     ✓ Merged specs into openspec/specs/ui/spec.md
     ✓ Moved to openspec/changes/archive/2025-01-24-add-dark-mode/
     Done! Ready for the next feature.
```
将增量spec合入主spec