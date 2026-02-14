AI Agent向LLM “提供” 了它能使用的工具列表，这个过程通常通过以下两种方式实现：
1. **静态工具注册（Static Tool Registration）：**
    - 在设计 AI Agent 系统时，开发者会预先定义并注册一系列可供 Agent 调用的工具。
    - 每个工具都有一个清晰的 **描述 (Description)**，说明其功能、参数和预期输出。例如，一个名为 `create_vm` 的工具，其描述可能是 “在指定的云平台上创建一个虚拟机实例，需要参数：`platform` (云平台名称), `region` (区域), `instance_type` (实例类型)”。
    - 这个描述和参数列表会被格式化成一种特殊的结构（如 JSON），并在每次调用 LLM 时，作为 **提示词（Prompt）** 的一部分发送给 LLM。
2. **动态工具发现（Dynamic Tool Discovery）：**
    - 在更复杂的系统中，AI Agent可能会通过查询MCP本身的元数据API来动态地发现可用工具。
    - MCP 可以提供一个`/tools`或`/api-spec`的端点，返回所有可用 API 的列表及其详细描述。
    - AI Agent在启动或需要时，可以调用这个API，获取最新的工具列表，并将其缓存。

> [!note]
> prompt是AI Agent与LLM之间的接口

