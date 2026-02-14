![](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_6a6119e1953b4166cc01e24bcedc79ca.jpg)
# 1. 支持协议：
AgentKit智能体运行时支持**A2A、MCP、标准HTTP**三种通信协议
# 2. agent访问方式
- **公网访问**：默认访问方式。
- **私网访问**：选择同地域中的任意一个VPC和子网，每个可用区支持最多选择一个子网。
# 3. 大模型
通过api endpoint对接的是火山方案
```go
# agentkit\toolkit\resources\samples\eino_a2a\agent.go
	cm, err := chatmodelprovider.NewChatModel(ctx, &chatmodelprovider.Config{
		Provider: os.Getenv("MODEL_AGENT_PROVIDER"),
		APIKey:   os.Getenv("MODEL_AGENT_API_KEY"),
		Model:    os.Getenv("MODEL_AGENT_NAME"),
		BaseURL:  os.Getenv("MODEL_AGENT_API_BASE"),
	})
```
## 3.1. 支持模型列表
- doubao
- deepseek
- kimi