---
aliases:
---
# 1. 工作流模式(Predefined Workflow)
## 1.1. 流水线
流水线是最简单直接的工作流编排，通过编排一个**顺序处理**的流程，让模型逐步执行和推理。
**场景示例：** 
文档处理系统：文档上传 → 格式转换 → 内容提取 → 语义分析 → 结果存储
## 1.2. 路由分发
路由分发是将输入分类（LLM意图识别）并引导到专门的子流程中，每个子流程可以执行一个特定的任务流。
**场景示例：** 
智能客服系统：接收用户问题 → 意图识别 → 路由到FAQ检索/人工客服/知识库查询
## 1.3. 并行处理
将任务分解为可并行执行的子任务，同时处理多个子任务以提高整体效率。
**场景示例**：
图像批量处理：将100张图片分成10个批次，每批10张图片同时进行AI识别处理
## 1.4. 迭代决策模式
基于上一步的结果决定下一步操作，通过多轮迭代逐步逼近最终答案。一般工作流会设定一个目标，然后通过迭代循环最终完成任务。
**场景示例：** 
代码生成助手：
目标：运行通过，输出目标结果
迭代过程：生成初始代码 → 运行测试 → 分析错误 → 修改代码 → 重新测试，直到通过所有测试
## 1.5. 流程嵌套
在主流程中嵌套子流程，子流程可以是完整的独立workflow，支持递归调用。
1. 模块化
2. 重用
## 1.6. 人工干预
任务执行过程中需要用户介入干预，可以通过一定的状态记忆方法去恢复状态
# 2. 自规划模式
## 2.1. ReAct
[ReAct](https://zhuanlan.zhihu.com/p/717760746)是一种最简单的自规划Agent设计模式，概念来自论文《ReAct: Synergizing Reasoning and Acting in Language Models》，这篇论文提出了一种新的方法，通过结合语言模型中的推理（reasoning）和行动（acting）来解决多样化的语言推理和决策任务。ReAct 提供了一种更易于人类理解、诊断和控制的决策和推理过程。

**Reason Only**：仅依赖大模型的推理能力，高度依赖对话上下文信息的丰富度和有效性。在上下文信息不足，同时缺乏执行能力，不能获取外部额外有效信息时，LLM容易造成幻觉。

在每步思考和规划中，ReAct同时包含了推理（Reason）和执行（Action），通过大语言模型的思考和规划，既输出由自然语言描述的思考过程，也输出格式化的工具指令，而论文中设计的工具是可以对维基百科进行关键词检索的API，因此执行大语言模型输出的工具指令可以获取外部信息，**将外部信息作为观察结果，和思考过程、工具指令合并，作为大语言模型下一步思考和规划的上下文**。论文通过组合推理和执行，能够有效获取外部信息作为大语言模型的知识补充，从而在知识问答（HotpotQA）和事实验证（FEVER）等任务上取得较好的效果，而ReAct的命名即“Reason”（推理）和“Action”（执行）的组合、缩写。

### 2.1.1. 典型流程
它的典型流程如下所示，可以用一个有趣的循环来描述：
思考（Thought）→ 行动（Action）→ 观察（Observation），简称**TAO循环**。
- 思考（Thought）：面对一个问题，LLM需要进行深入的思考。这个思考过程是关于问题是什么、如何拆解的过程，思考过后通常会决定下一步调用什么工具。
- 行动（Action）：确定了任务的方向后，Agent会根据LLM的指示来进行工具的调用，推动子任务的完成。
- 观察（Observation）：行动之后，LLM会学习工具的输出，以判断问题是否得到解决。

通过提示工程让大语言模型对复杂问题分步思考和规划，每步思考和规划按以下格式进行推理和执行：
```text
Thought:[思考过程]
Action:[工具指令]
Observation:[观察结果]
```
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202508062219339.png)
上图是论文中的例子，React过程如下：
1. 原问题是“Aside from the Apple Remote, what other device can control the program Apple Remote was originally designed to interact with?”，即“除了苹果遥控器之外，还有哪些设备可以实现App Remote类似功能，控制最初设计用于和App Remote交互的程序”
2. 大语言模型第一步思考和规划给出的思考过程和工具指令分别是"I need to search App Remote and find the program it was originally designed to interact with.”和“Search[Apple Remote]"，即检索和"Apple Remote"相关的语句，查找和其交互的程序，因此Agent调用工具的API获取相关信息，**拼接到“Observation”的后面**，和第一步的思考过程、工具指令合并，作为大语言模型第二步思考和规划的上下文
3. 大语言模型第二步思考和规划给出的思考过程和工具指令分别是"Apple Remote was originally designed to control the Front Row media center program. I need to search Front Row next and find what other device can control it.”和"Search[Front Row]"，即检索和“Front Row”相关的语句，查找可控制“Front Row”的设备，如此经过共4步的思考和规划过程，最终大语言模型输出正确的答案"keyword function keys"，即"keyword function keys"也可以控制最初设计用于和苹果遥控器交互的程序。
### 2.1.2. [实现过程](https://zhuanlan.zhihu.com/p/717760746)
#### 2.1.2.1. 提示词模板
在实现ReAct模式的时候，首先需要设计一个清晰的Prompt模板，主要包含以下几个元素：  
- 思考（Thought）：这是推理过程的文字展示，阐明我们想要LLM帮我们做什么，为了达成目标的前置条件是什么  
- 行动（Action）：根据思考的结果，生成与外部交互的指令文字，比如需要LLM进行外部搜索  
- 行动参数（Action Input）：用于展示LLM进行下一步行动的参数，比如LLM要进行外部搜索的话，行动参数就是搜索的关键词。主要是为了验证LLM是否能提取准确的行动参数  
- 观察（Observation）：和外部行动交互之后得到的结果，比如LLM进行外部搜索的话，那么观察就是搜索的结果。
```
Answer the following questions as best you can. You have access to the following tools:

{tool_names}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can be repeated zero or more times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {query}"""
```
#### 2.1.2.2. 构建agent
一个ReAct Agent需要定义好以下元素
- llm：背后使用的LLM大模型
- tools：后续会用到的Tools集合
- stop：什么情况下ReAct Agent停止循环
```typescript
class LLMSingleActionAgent {
  llm: AzureLLM
  tools: StructuredTool[]
  stop: string[]
  private _prompt: string = '{input}'
  constructor({ llm, tools = [], stop = [] }: LLMSingleActionAgentParams) {
    this.llm = llm
    this.tools = tools
    if (stop.length > 4)
      throw new Error('up to 4 stop sequences')
    this.stop = stop
  }
 }
```
#### 2.1.2.3. 定义tools
Tools有两个最重要的参数，name和description。  
Name就是函数名，description是工具的自然语言描述，LLM 根据description来决定是否需要使用该工具。工具的描述应该非常明确，说明工具的功能、使用的时机以及不适用的情况。
#### 2.1.2.4. 循环执行
Agent会始终进行如下事件循环直到目标被解决了或者思考迭代次数超过了最大次数：
- 根据之前已经完成的所有步骤（Thought、Action、Observation）和目标（用户的问题），规划出接下来的Action（使用什么工具以及工具的输入）
- 检测是否已经达成目标，即Action是不是ActionFinish。是的话就返回结果，不是的话说明还有行动要完成。
- 根据Action，执行具体的工具，等待工具返回结果。工具返回的结果就是这一轮步骤的Observation。
- 保存当前步骤到记忆上下文，如此反复
```typescript
async call(input: promptInputs): Promise<AgentFinish> {
    const toolsByName = Object.fromEntries(
      this.tools.map(t => [t.name, t]),
    )

    const steps: AgentStep[] = []
    let iterations = 0

    while (this.shouldContinue(iterations)) {
      const output = await this.agent.plan(steps, input)
      console.log(iterations, output)

      // Check if the agent has finished
      if ('returnValues' in output)
        return output

      const actions = Array.isArray(output)
        ? output as AgentAction[]
        : [output as AgentAction]

      const newSteps = await Promise.all(
        actions.map(async (action) => {
          const tool = toolsByName[action.tool]

          if (!tool)
            throw new Error(`${action.tool} is not a valid tool, try another one.`)

          const observation = await tool.call(action.toolInput)

          return { action, observation: observation ?? '' }
        }),
      )

      steps.push(...newSteps)

      iterations++
    }

    return {
      returnValues: { output: 'Agent stopped due to max iterations.' },
      log: '',
    }
  }
```
循环终止条件
1. `'returnValues' in output`，获得预期结果
2. 达到最大循环次数
## 2.2. Plan and solve
1. **plan**：将任务拆解为多个步骤
2. **Solve**：按步骤执行任务，上一步执行的结果会影响下一步任务的执行，可以动态调整plan
## 2.3. Plan and Replan
ReAct的一种高阶版本，包括Planner和Executor两种角色，Planner和Executor分别使用不同的提示词，Planner负责提出任务的执行计划，这个计划可能包含多个复杂的步骤。Executor负责执行任务执行。Execurot的执行结果会给Replanner进行判断，决定是输出还是重新规划。
