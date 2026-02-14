---
aliases:
  - Chatbot -> workflow -> AI Agent
---
# 1. LLM
E.G. Chat GPT, Google Gemini and claude.
## 1.1. Work Mechanism
Human provide an input and the LLM responds with an output.
> input(prompt) -> LLM -> output(email)

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507072203701.png)

## 1.2. Key Traits
- LLM是被动式工作模式， `wait prompt and then reponse`，**prompt**的好坏决定了模型输出的准确性
- 虽然大语言模型是通过大量的数据训练得到的，但是LLM对个人信息、内部商业数据等了解有限
- LLM是基于过去的数据进行训练的，无法提供最新的数据或消息
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507072206372.png)

> [!note] LLM与搜索引擎的使用区别 
> 当我们想知道如何使用 Python 编写斐波那契数列的时候。
> - python fibonacci  -------> 适合传统搜索引擎，倒排索引
> - 编写一个用python函数来高效地计算fibonacci数列。评论每一行代码以解释每一部分的作用以及为什么这样写  -------> 适合LLM，上下文清晰，目的明确
# 2. AI Workflows
## 2.1. Control Logic
Human provide an input and tell the LLM to follow **a predefined path** that may involve in retrieving information from external tools. 
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507072209789.png)
The predefined path is technically called control logic.
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507072212776.png)
当我们问天气怎么样的时候，由于ai workflow只能根据预设的路径工作，因此LLM也只能去查看日历
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507072210780.png)
当然，一个AI workflow可以变得更复杂一点（即使有上百个步骤），但是其始终是ai workflow，而不是ai agent。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507072213277.png)
## 2.2. Key Traist
The key trait is that **the human programs a path** for LLM to follow.
# 3. AI Agent
AI Agent可以通过[[RAG]]和配套的工具获取额外的信息输入到LLM中作为上下文。工具可能包括一些确定性功能，如任何代码函数或外部API，甚至是其他智能体。

[LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/)一文叙述了基于大语言模型的Agent的整体架构，其中包含以下核心组件：
- **Planning**
    - **分而治之**(Subgoal and decomposition): 和人类思考和解决问题的方式类似，Agent会将大型任务分解为更小的且可管理的子任务，从而可以高效的处理复杂任务。
    - **反思与优化**(Reflection and refinement): 智能体能够对过去的行为进行自我批判和反思，从错误中学习并为未来的步骤进行优化，进而提高最终结果的质量。
- **Memory**
    - [[记忆#1. 短期记忆|Short-term memory:]] 对话上下文信息，包括prompt、对话历史、前序步骤的大语言模型推理结果和工具执行结果等
    - Long-term memory: 为智能体提供了在较长时间知识回忆的能力，通常通过利用外部向量存储（vector store）和快速检索来实现，目前比较流行的技术是RAG。
- **Tool Use**
    - 如果没有Tool Use的能力，那LLM的作用会大大受限。AI Agent可以学习调用外部API以获取在训练阶段缺失的额外信息，包括最新的消息、代码执行能力、对私有知识库的访问等
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202508062144794.png)
> [!note]
> 业界主流观点中，AI agent定义的主张是自主化、自动化，即AI agent可以实现plan + action的能力，能够决定需要调用哪些工具，以及什么时候调用工具。
## 3.1. ReAct Framework
ReAct Framework = Reasoning + Act
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507072227077.png)
在ai workflows中，如果我们对输出结果不满意，我们需要人工修改LLM输入的prompt。但是利用AI agent，我们可以让LLM实现自主迭代。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507072231348.png)
得到最终结果
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507072231223.png)

![[设计模型(work flow & Agent)#2.1. ReAct]]
## 3.2. Key Traist
The key traist here is that the LLM is **a decision maker** in the workflow.
## 3.3. Execution Process
![[ai_agent_service_selection 2.html]]

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202507092300437.png)
### 3.3.1. Service Discover
- 从用户输入中提取关键词
- 与工具描述中的关键词进行匹配
- 计算匹配度得分，选择合适工具
服务可以通过mcp协议提供工具的发现能力，实现工具的热插拔
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "result": {
    "tools": [
      {
        "name": "file_search",
        "description": "Search for files in the filesystem",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {"type": "string"},
            "path": {"type": "string"}
          }
        }
      }
    ]
  }
}
```
## 3.4. AI Agent-LLM-(Tools|Resource|Prompt)
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202508151924129.png)
> [!note]
> function calling解决的是AI Agent如何和LLM通信的问题
> mcp解决的是AI Agent和tools之间通信的问题
### 3.4.1. system prompt
1. 将函数以及函数的功能描述、使用方法等注册到AI Agent
2. AI Agent根据注册的信息生成[[概念|system prompt]]，包括tools如何使用，包括功能描述、入参、出参等。
3. AI Agent将system prompt连同user prompt一起发送给LLM
4. LLM按照函数要求格式返回调用请求
5. AI Agent解析响应，并进行实际工具调用
6. AI Agent将调用结果追加到上下文中，返回给LLM 
7. LLM根据工具调用结果，决定下一步动作：输出最终结果或重复调用工具
### 3.4.2. function calling
不同的工具的system prompt写的不一样，标准格式也不规范，不利于LLM针对性学习。function calling则是通过json-rpc的方式对工具的调用进行了标准化。tools的定义也从system prompt中剥离出来，放到单独的请求字段`tools`中。
- function calling调用和响应格式标准化，利于LLM针对性学习和纠错
- 部分开源模型不支持function calling，不同大厂的function calling定义标准可能不相同。
- 目前，system prompt和function calling并存 
### 3.4.3. mcp
AI Agent和Tools通信最简单的方式是直接把这两者写在同一程序中，直接本地函数调用。但是有些函数比较通用，为了避免在每个AI Agent里面拷贝一份代码，可以通过mcp把工具抽出来单独发布为一个服务。
# 4. Function calling
智能体需要大语言模型能够针对问题从多个候选工具中选择合适的工具进行调用，并给出调用工具所传递的参数，因此**大语言模型的输入中既需要包括问题，也需要包括每个候选工具的功能、参数说明，还需要包括让大模型以何种格式输出需要调用工具的名称和参数值。**

为了对候选工具的功能、参数的输入以及待调用工具的名称和参数值的输出进行**规范化**，OpenAI于2023年6月推出Function Call，首次将工具调用能力标准化，其采用JSON格式描述工具的名称、参数。后续不少厂商提供的大语言模型服务也支持Function Call形式的工具调用，并兼容OpenAI的API协议，可以按照OpenAI的API协议或直接使用OpenAI提供的SDK（仅需指定其他厂商提供的兼容OpenAI协议的API地址），访问其他厂商提供的大语言模型服务，并实现Function Call形式的工具调用。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202508152058143.png)

按照OpenAI的API协议或直接使用OpenAI提供的SDK访问。用户提问和已有天气预报工具，若按照OpenAI的API协议访问大语言模型服务，则请求体如下所示：
```json
{
  "model": "Claude Sonnet4",
  "temperature": 0.8,
  "messages": [
    {
      "role": "system",
      "content": "你是一个智能助手。今天的日期是：2025-05-16。"
    },
    {
      "role": "user",
      "content": "明天北京的天气适合跑步吗？"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": 
      {
        "name": "getDailyWeather",
        "description": "获取所传入城市今天、明天和后天的天气",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "城市名称"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```
大模型通过返回对象的`tool_calls`参数，指定需要使用的工具函数名称为：`getDailyWeather`，并指定函数的入参为：`"{\"location\": \"上海\"}"`。
```json
{
    "content": "",
    "refusal": null,
    "role": "assistant",
    "audio": null,
    "function_call": null,
    "tool_calls": [
        {
            "id": "call_6596dafa2a6a46f7a217da",
            "function": {
                "arguments": "{\"location\": \"上海\"}",
                "name": "getDailyWeather"
            },
            "type": "function",
            "index": 0
        }
    ]
}
```

> 如果提问的问题被大模型判断为无需使用工具，则不会返回`tool_calls`参数，并会通过`content`参数直接进行回复。
# 5. MCP
Function Calling将工具调用能力标准化。智能体按照协议将结构化的工具信息传递给大语言模型，大语言模型也按照协议将结构化的待调用工具和参数值返回给智能体。通过Function Calling提升了智能体和大语言模型交互、由大语言模型决定使用哪种工具的效率，并且避免了若智能体自行设计工具调用的提示、与大语言模型工具调用的微调语料格式不一致、进而影响大语言模型在工具调用上的指令跟随效果的问题。

虽然Function Calling解决了大语言模型如何高效、便捷地**为智能体选择哪个工具调用的问题**，但是Function Calling并没有解决如何高效、便捷**地为智能体实现和管理工具的问题**。在FunctionCall这一节的示例中，智能体需要事先设计名称为“getDailyWeather”的获取城市天气预报的工具，描述其信息，实现其功能。若该智能体还计划引入其他工具能力，则需要进一步设计和实现其他工具。而若希望已有的工具能被其他智能体复用，虽然可以通过API的方式对外提供调用接口，但缺乏标准化的工具描述和调用协议，即使是以API方式对接已有工具、非完全重新实现工具功能，对于智能体来说，引入已有工具、实现工具调用也有一定的开发成本。

[[MCP概念理解|MCP]]解决了**如何高效、便捷地为智能体实现和管理工具**的问题。当然，MCP并不仅限于工具调用，它还包括对资源和提示的管理。但本篇主要聚焦在工具调用方面的介绍。
# 6. conclusion
1. LLM应用应该面向问题场景提供最简单的解决办法，chatbot + 工具化增强的模块化系统（如rag)可能足够解决问题
2. 面向复杂任务场景、任务流程比较确定时，可以使用工作流，结果具备可预测性和一致性
3. 对于更复杂或者不确定性的任务，ai agent会是一个比较好的选择。
# 7. ref
1. https://www.youtube.com/watch?v=FwOTs4UxQS4
2. http://va.landing.ai/agent

# 8. Mind Map

![AI Agent综述](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202601072154804.png)
