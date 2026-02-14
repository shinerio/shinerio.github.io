run_code是一个来自veadk库的内置工具，它提供了一个安全的代码执行沙箱功能。这个工具允许AI Agent运行用户请求的代码片段（主要是 Python3），并返回执行结果。该工具通过字节跳动云服务的API在远程安全环境中执行代码，并具有会话管理和身份验证功能。

# 1. 工作原理
## 1.1. 工具注册和描述机制
  在 agent.py 中，run_code工具被显式地注册到 Agent 中`tools=[run_code, mcp_router]`
## 1.2. 工具元数据和功能描述
run_code 函数本身包含详细的描述信息
```python
  def run_code(
      code: str, language: str, tool_context: ToolContext, timeout: int = 30
  ) -> str:
      """Run code in a code sandbox and return the output.
      For C++ code, don't execute it directly, compile and execute via Python; write sources and object files to /tmp.

      Args:
          code (str): The code to run.
          language (str): The programming language of the code. Language must be one of the supported languages: python3.
          timeout (int, optional): The timeout in seconds for the code execution. Defaults to 30.

      Returns:
          str: The output of the code execution.
      """
```
## 1.3. 提示词(instruction)中的明确指引
在 agent.py中，Agent的instruction明确告诉 LLM 如何使用工具：
```
  instruction="""你是一个友好的智能个人助手，请用简洁明了的语言回答用户的问题。
  如果用户询问与知识库相关的信息，请使用知识库检索。
  如果用户提到个人偏好或重要信息，请将其存储到长期记忆中。
  如果需要执行代码生成任务，请使用代码沙箱工具。
  如果需要执行其他任务，请选取合适的MCP工具。"""
```
## 1.4. 运行时发现和调用机制
  步骤 1: 工具发现
  - 当 Agent 初始化时，所有注册的工具（包括 run_code）的描述信息会被传递给 LLM
  - LLM 学习每个工具的用途、参数要求和返回类型
  步骤 2: 任务识别
  - 当用户提出请求时，LLM 分析用户意图
  - 如果请求涉及计算、编程或代码执行，LLM 会识别出需要使用 run_code 工具
  步骤 3: 代码生成
  - LLM 根据用户需求生成适当的 Python 代码
  - 确保代码符合沙箱环境的限制（如只使用支持的库等）
  步骤 4: 工具调用
  - LLM 以结构化格式（通常是 JSON）指定调用 run_code 工具
  - 提供必要的参数：代码内容、编程语言、可能的超时设置

**实际工作流程示例**
  用户: "请帮我计算100以内所有偶数的和"

  LLM 思考过程:
  1. 分析问题 → 这是一个数学计算任务
  2. 检查可用工具 → 发现有 run_code 工具
  3. 确定解决方案 → 使用 Python 计算
  4. 生成代码 → 写一个简单的 Python 循环来计算偶数和
  5. 调用工具 → 传入代码和语言类型

  实际调用类似:
  {
    "tool_name": "run_code",
    "arguments": {
      "code": "total = sum(i for i in range(0, 101, 2))\nprint(total)",
      "language": "python3"
    }
  }

  沙箱执行后返回结果 → LLM 整理结果返回给用户