[A2A](https://a2a-protocol.org/latest/topics/what-is-a2a/)协议是一项开放标准，旨在解决人工智能快速发展领域中的一个基本挑战：由不同团队构建、使用不同技术且归不同组织所有的AI Agents，如何有效通信与协作？

随着人工智能代理变得更加专业化和强大，它们在复杂任务上协同工作的需求也日益增长。想象一下，用户让其主要的人工智能助手规划一次国际旅行。这一个请求可能就需要协调多个专业代理的能力：
1. 负责航班预订的Agent。
2. 负责酒店预订的Agent。
3. 负责本地旅游推荐和预订的第三个Agent。
4. 负责货币兑换和旅行建议的第四个Agent。
如果没有通用的通信协议，将这些不同的代理整合起来以提供连贯的用户体验会是一个重大的工程难题。每次整合都可能需要定制的点对点解决方案，这会使系统难以扩展、维护和扩展功能。
# 1. Solution
A2A为这些独立的、通常是 “不透明的”（黑箱）智能体系统提供了一种标准化的交互方式。它定义了：  
・**通用的传输方式和格式**：用于消息构建和传输的基于 HTTP（S）的`JSON-RPC 2.0`。  
・**发现机制（Agent Cards）**：Agent如何公告自身的能力并被其他智能体发现。  
・**任务管理工作流**：协作任务如何启动、推进和完成。这包括对可能长期运行或需要多轮交互的任务的支持。  
・**对各种数据模态的支持**：智能体不仅交换文本，还交换文件、结构化数据（如表单）以及可能的其他富媒体。  
・**安全性和异步性的核心原则**：关于安全通信以及处理可能需要大量时间或涉及人工参与流程的任务的指导方针。
# 2. Process Flow
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202508162018776.png)
## 2.1. Agent Card
A JSON metadata document, typically discoverable at a well-known URL (e.g., `/.well-known/agent-card.json`), that describes an A2A Server.
- **Identity:** `name`, `description`, `provider` information.
- **Service Endpoint:** The `url` where the A2A service can be reached.
- **A2A Capabilities:** Supported protocol features like `streaming` or `pushNotifications`.
- **Authentication:** Required authentication `schemes` (e.g., "Bearer", "OAuth2") to interact with the agent.
- **Skills:** A list of specific tasks or functions the agent can perform (`AgentSkill` objects), including their `id`, `name`, `description`, `inputModes`, `outputModes`, and `examples`.

# 3. A2A & MCP
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202508162025264.png)
