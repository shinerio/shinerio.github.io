Amazon Bedrock AgentCore是用于构建、部署、高效运行Agent的最先进的智能化平台，其服务包括Runtime, Gateway, Memory, Identity, Observability, Browser, Code Interpreter, Evaluation, policy.
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260119234030464.png)
# 1. agentCore identity
简化了agent的访问管理。允许agent安全的访问AWS资源、三方工具以及经用户预先授权的服务。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202601212216282.png)

# 2. agentCore gateway
AgentCore Gateway允许Agent安全地访问工具、数据和其他agents，它能够将API和Lambda函数转换为与Agent兼容的工具，并连接到现有的 MCP 服务器。
# 3. agentCore memory
使用Memory来保留整个对话过程中的上下文信息，并在多个代理之间共享这些信息，从而实现多轮对话。
**短期记忆**会在一个会话中存储最近的交互和事件（例如消息或操作），以便快速回忆和提供上下文。
**长期记忆**会随着时间从短期事件中自动生成，并根据你定义的记忆策略总结关键洞察。
# 4. agentCore runtime
runtime是一个安全的、serverless的部署、弹性扩缩**AI Agents**和**tools**的运行时环境。支持低时延、实时交互、最长8小时运行复杂任务的异步。


创建的时候需要选择一个IAM ROlE，自动创建的具有以下权限

| Service         | Access level         | Resource      | Request condition                        |
| --------------- | -------------------- | ------------- | ---------------------------------------- |
| Bedrock         | Limited: Read        | Multiple      | None                                     |
| CloudWatch      | Limited: Write       | All resources | cloudwatch:namespace = bedrock-agentcore |
| CloudWatch Logs | Limited: List, Write | Multiple      | None                                     |
| X-Ray           | Limited: Read, Write | All resources | None                                     |
# 5. agentCore observability
通过全面的运营洞察帮助agent提升性能。通过Amazon CloudWatch平台，AgentCore Observability能能提供运行性能的实时监控看板，包括traces、session数量、latency、duration、token usage、error rates等指标。