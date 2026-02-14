# 1. 基本概念
MCP(Model Context Protocol 模型上下文协议) 是一个开放的标准化协议，用于在AI模型和外部数据源、工具之间建立安全、可控的连接。它定义了AI系统如何**访问和利用**外部上下文信息的规范。MCP就像是AI应用程序的USB-C接口，为AI模型提供了一种标准化的方式来连接不同的数据源和工具。

**AI Agent**是能够自主感知环境、做出决策并执行行动的智能实体，通常具备推理、规划、学习等能力。

两者的关系可以理解为：MCP为AI Agent提供了一个标准化的"接口层"，使Agent能够安全、有效地获取和利用外部资源。
![mcp_architecture_zh.svg](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507271617253.svg)
# 2. 核心组件
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507092309051.png)
总共分为了下面五个部分：
- **MCP Hosts**: Hosts是指发起连接的LLM应用程序，像 Cursor, Claude Desktop或[Cline](https://github.com/cline/cline) 这样的应用程序。
- **MCP Clients**: 客户端是用来在Hosts应用程序内与Server之间保持**1:1**连接，从MCP Server获取context一遍MCP Host可以使用。
- **MCP Server**s: 通过标准化的协议，为Client端提供context，比如resources、tools和prompts
- **Local Data Sources**: 本地的文件、数据库和 API。
- **Remote Services**: 外部的文件、数据库和 API。

本章节主要参考(https://modelcontextprotocol.io/docs/learn/architecture)[https://modelcontextprotocol.io/docs/learn/architecture]
# 3. 原理
## 3.1. MCP server
MCP Server就是为了实现AI Agent的自动化而存在的，它是一个中间层，告诉AI Agent目前存在哪些服务，哪些API，哪些数据源，AI Agent 可以根据 Server 提供的信息来决定是否调用某个服务，然后通过Function Calling来执行函数。
MCP servers可以在本地或者远程执行：
1. Claude Desktop launches the [filesystem server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem), the server runs locally on the same machine because it uses the STDIO transport. This is commonly referred to as a “local” MCP server. 
2. The offical [Sentry MCP server](https://docs.sentry.io/product/sentry-mcp/) runs on the Sentry platform, and uses the Streamable HTTP transport. This is commonly referred to as a “remote” MCP server.
## 3.2. MCP client
1. The client gets the list of available tools from the server
2. Your query is sent to Claude along with tool descriptions
3. Claude decides which tools (if any) to use
4. The client executes any requested tool calls through the server
5. Results are sent back to Claude
6. Claude provides a natural language response
7. The response is displayed to you
## 3.3. Layers
MCP consists of two layers
### 3.3.1. Data Layer
使用JSON-RPC作为C/S通信协议，所有传输都使用[JSON-RPC](https://www.jsonrpc.org/) 2.0来交换消息。有关Model Context Protocol消息格式的详细信息，请参阅[规范](https://spec.modelcontextprotocol.io/)。示例如下：
```
客户端 → 服务器：HTTP POST /mcp
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {...},
  "id": 1
}

服务器 → 客户端：HTTP Response + SSE
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"jsonrpc": "2.0", "result": {...}, "id": 1}

data: {"jsonrpc": "2.0", "method": "notification", "params": {...}}
```
### 3.3.2. Transport Layer
定义C/S之间通信机制，包括连接建立、消息框架和认知机制。传输层处理客户端和服务器之间的实际通信。
#### 3.3.2.1. stdio
- 使用标准输入/输出进行通信
- 适用于本地进程

操作系统会：
1. 创建**匿名管道**（anonymous pipes）
2. 将服务器进程的stdout连接到管道的写入端
3. 将客户端进程stdin连接到管道的读取端
#### 3.3.2.2. SSE
SSE是一种**服务器主动向客户端推送数据**的技术，建立在HTTP协议之上。在MCP中，SSE用于实现服务器到客户端的持续通信。
**SSE的工作流程**
1. **连接建立**：客户端通过HTTP GET请求建立连接
2. **持久连接**：服务器保持连接打开，不立即关闭
3. **单向推送**：服务器可以持续向客户端发送事件数据
4. **自动重连**：连接断开时，浏览器会自动尝试重连
[SSE](https://www.ruanyifeng.com/blog/2017/05/server-sent_events.html)（Server-Sent Events）是除了 [WebSocket](https://www.ruanyifeng.com/blog/2017/05/websocket.html)外，另一种服务器向浏览器推送信息的方法。
**场景**：AI Agent需要执行一个长时间运行的Python脚本或数据处理任务
```
用户请求：分析这个100GB的数据文件并生成报告

传统方式问题：
- 用户等待时间过长，不知道进度
- 可能超时或连接中断
- 无法及时发现执行错误

使用SSE的优势：
```
**SSE流式反馈**：
```
data: {"type": "progress", "message": "正在读取数据文件... 10%"}
data: {"type": "progress", "message": "数据预处理中... 35%"}  
data: {"type": "progress", "message": "正在计算统计指标... 60%"}
data: {"type": "warning", "message": "发现异常值，已自动处理"}
data: {"type": "progress", "message": "生成可视化图表... 90%"}
data: {"type": "complete", "result": "报告已生成，保存至report.pdf"}
```
SSE能力让AI Agent能够：
- **提供实时反馈**：用户随时了解任务进度
- **及时响应变化**：快速应对突发情况
- **提升用户体验**：减少等待焦虑，增加互动性
- **支持复杂工作流**：处理需要多步骤协调的复杂任务
这些场景都需要服务器主动推送信息给客户端，而不是等待客户端轮询，SSE正是为此设计的理想解决方案。
#### 3.3.2.3. Streamable HTTP
在 MCP 的初始设计中，为了实现服务器主动向 AI 客户端推送信息，采用了 **HTTP + SSE**。但这带来了“双线作战”的问题：客户端通过 POST 发消息，服务器通过 SSE 回消息。 这种模式在复杂的网络环境下（比如有负载均衡或防火墙时）非常脆弱，且难以进行权限校验和会话跟踪。**SSE**（Server-Sent Events）是 MCP 早期版本中用于远程通信的传输方式，而 **Streamable HTTP** 是从 2025 年 3 月起引入的**新标准**，旨在取代纯 SSE 方案。
**Streamable HTTP** 并不是完全抛弃了 SSE，而是将其**封装**进了一个更健壮的框架中：
- **统一化**：它不再区分专门的事件流端点。当你对 MCP 端点发起 `GET` 请求时，它会返回 `text/event-stream`；而 `POST` 请求则用于发送指令。
- **会话感知**：引入了 `Mcp-Session-Id` 头部。这意味着即便底层的 TCP 连接断了，只要 Session ID 还在，服务器就能找回之前的状态。
- **灵活性**：服务器可以根据需要决定是直接返回一个普通的 HTTP 响应，还是升级成一个 SSE 流来处理长任务（如大模型生成过程）。

| **特性**   | **SSE (旧版/Legacy)**                         | **Streamable HTTP (新版/标准)**                         |
| -------- | ------------------------------------------- | --------------------------------------------------- |
| **端点数量** | **双端点**：通常需要 `/sse`（接收消息）和 `/message`（发送消息） | **单端点**：所有操作通过同一个路径（如 `/mcp`）完成                     |
| **连接模型** | 必须维持一个长期的长连接，对基础设施要求高                       | 按需建立连接，更加“无状态”，对云原生/Serverless 更友好                  |
| **通信方向** | 严格单向（服务器到客户端），客户端必须另开 HTTP 请求               | 支持在一个逻辑会话中更灵活地处理双向消息                                |
| **恢复能力** | 连接断开后状态极易丢失，重连逻辑复杂                          | 原生支持**会话管理 (Session ID)** 和**断线重连 (Last-Event-ID)** |
| **兼容性**  | 容易被防火墙、代理或网关（如超时设置）强行切断                     | 兼容标准 HTTP 中间件，能够更好地穿透 CDN 和 API 网关                  |
## 3.4. Primitives
### 3.4.1. server side
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507271643120.png)
#### 3.4.1.1. Tools
Executable functions that AI applications can invoke to perform actions 
- file operations
- API calls
- database queries
#### 3.4.1.2. Resources
Data sources that provide contextual information to AI applications
- file contents
- database records
- API responses
定制化地请求和访问本地的资源，可以是文件系统、数据库、当前代码编辑器中的文件等等原本网页端的app无法访问到的**静态资源**。额外的resources会丰富发送给大模型的上下文，使得AI给我们更加精准的回答。
#### 3.4.1.3. Prompts
有助于构建与LLM交互结构的可复用模板（例如，系统提示词、少样本示例）
- **System prompts**：系统提示词，是用户预先设定的指令，用于定义模型的角色、任务目标或行为边界（例如：“请以专业医生的身份回答健康问题，语言通俗易懂”）。
- **Few-shot examples**：少样本示例，指在提问时提供少量示例，让模型通过模仿示例理解任务要求（例如：要求模型生成对仗句时，先给出 “天对地，雨对风” 作为示例）
### 3.4.2. client side
#### 3.4.2.1. Sampling
允许服务器从客户端的 AI 应用程序中请求语言模型生成结果。当服务器开发者希望使用语言模型，但又希望保持模型独立性，且不想在其 MCP 服务器中集成语言模型 SDK 时，这种方式非常有用。他们可以通过`sampling/complete`方法从客户端的 AI 应用程序中请求语言模型生成结果。
核心价值：
- 客户端负责管理 AI 模型（包括集成 SDK、维护模型版本、处理认证等），服务器只需通过统一接口（如`sampling/complete`）请求结果。
- 优势：降低服务器的开发和维护成本（无需适配多种模型），同时保持灵活性（客户端可自主升级或更换模型，不影响服务器）
典型场景：
- 游戏服务器需要 AI 生成 NPC 对话，但不想绑定某款语言模型，可让玩家客户端的 AI 应用程序处理模型调用，服务器仅通过接口获取对话文本。
#### 3.4.2.2. Elicitation
允许服务器向用户请求额外信息。当服务器开发者希望从用户那里获取更多信息，或请求用户确认某项操作时，这种方式非常有用。他们可以通过`elicitation/request`方法向用户请求额外信息。
核心价值：
- 服务器可根据业务需求动态触发信息请求，避免因信息缺失导致流程中断（例如注册时遗漏手机号、提交表单时字段不完整）。
- 对于需要用户确认的敏感操作（如删除数据、支付订单），通过`elicitation/request`发起确认请求，可降低误操作风险，提升系统安全性。
典型场景：
- 电商平台服务器在用户下单后发现商品库存不足，通过该方法询问用户是否接受替换同类商品；
- 社交应用服务器检测到用户登录设备异常，通过该方法请求用户输入验证码以确认身份。
#### 3.4.2.3. Roots
## 3.5. notifications
The protocol supports real-time notifications to enable dynamic updates between servers and clients. For example, when a server’s available tools change—such as when new functionality becomes available or existing tools are modified—the server can send tool update notifications to inform connected clients about these changes. Notifications are sent as JSON-RPC 2.0 notification messages (without expecting a response) and enable MCP servers to provide real-time updates to connected clients.
# 4. MCP的初衷
在MCP出现之前，AI Agent就已经可以通过直接调用API来获取外部信息。

| 对比维度       | 传统API调用              | MCP方式                |
| ---------- | -------------------- | -------------------- |
| **标准化程度**  | 每个服务都有独特的接口规范，需要单独适配 | 统一的协议标准，所有服务遵循相同接口规范 |
| **集成复杂度**  | 需要为每个API编写专门的客户端代码   | 一次开发，支持所有MCP兼容服务     |
| **上下文管理**  | 通常是无状态的请求-响应模式       | 支持上下文持久化和增量更新        |
| **权限控制**   | 每个API有自己的认证和授权机制     | 统一的权限模型和访问控制         |
| **开发维护成本** | 高：需要维护多套API客户端代码     | 低：统一的开发和维护模式         |
| **扩展性**    | 添加新服务需要编写新的适配代码      | 新服务只需实现MCP标准即可接入     |
| **错误处理**   | 每个API有不同的错误格式和处理方式   | 统一的错误处理机制            |
| **调试和测试**  | 需要针对每个API编写不同的测试用例   | 统一的测试和调试工具           |

# 5. 技术原理
**MCP的核心原理**：
- 建立标准化的通信协议，定义数据格式、认证机制、权限控制等
- 提供统一的API接口，屏蔽底层数据源的差异性
- 实现上下文信息的动态获取和更新机制
**在AI Agent中的作用**：
- **上下文增强**：Agent通过MCP获取实时、相关的外部信息，丰富其决策依据
- **工具调用**：Agent可以通过MCP调用外部工具和服务，扩展其能力边界
- **知识整合**：将多源异构的信息统一整合，为Agent提供完整的知识视图
# 6. 实际应用场景
**企业级AI助手**：
- Agent通过MCP连接企业内部数据库、文档系统、业务系统
- 实现跨部门信息整合，提供综合性的决策支持
- 确保数据访问的安全性和合规性
**智能客服系统**：
- Agent利用MCP实时获取客户历史记录、产品信息、库存状态
- 动态调用外部API获取物流、支付等信息
- 提供个性化、准确的客户服务
**研发协作平台**：
- Agent通过MCP连接代码库、文档系统、测试环境
- 实现代码分析、文档生成、测试执行等自动化任务
- 支持多工具链的协同工作
**智能分析系统**：
- Agent通过MCP获取多维度数据源（数据库、API、文件系统）
- 实现实时数据分析、报告生成、预警通知
- 支持复杂的业务逻辑处理
# 7. 技术优势
**标准化**：MCP提供统一的接口标准，降低了Agent与外部系统集成的复杂度
**安全性**：通过协议层面的权限控制和认证机制，确保数据访问的安全、
**可扩展性**：Agent可以轻松接入新的数据源和工具，无需重新开发
**实时性**：支持动态上下文获取，使Agent能够基于最新信息做出决策
**互操作性**：不同的AI系统可以通过MCP标准实现互联互通

# 8. ref
1. https://guangzhengli.com/blog/zh/model-context-protocol
2. https://modelcontextprotocol.io/introduction