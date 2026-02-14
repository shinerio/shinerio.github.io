# 1. 基本定义
- 每个MCP服务器都是一个独立json对象，以服务器名称作为key
- key在MCP配置文件中以及全局配置文件和项目配置文件中必须是唯一的
- 每个MCP服务器条目对象都必须具有`command`属性
# 2. local mcp server
- `cwd`（可选）：在执行`command`之前，先将进程的工作目录切换到指定路径，类似于先执行`cd`命令。在command或args指定相对路径时有用。
- `command`（必填）：用于启动MCP服务器的命令
- `args`（可选）：启动服务器时要传递给服务器的命令行参数数组。参数按配置文件中定义的确切顺序传递。如果未定义，则不会向服务器传递任何参数。
- `env`（可选）：启动服务器时要设置的环境变量的对象。每个值都必须是一个字符串。如果未定义，则不设置任何环境变量。
- `timeout`（可选）：客户端等待来自MCP服务器的响应以进行工具调用、提示检索或资源检索的最长时间（以毫秒为单位）。这必须是正整数值。如果未定义，则使用默认值 60,000 ms（1 分钟）。
服务器配置示例：
```json
{
  "mcpServers": {
    "stdio-mcp-server-example": {
    "cwd": "/home/user/projects/my-mcp-project",
      "command": "mycommand",
      "args": [
        "arg1",
        "arg2"
      ],
      "env": {
        "API_KEY": "value1",
        "ENV_VAR1": "value1",
        "ENV_VAR2": "value2"
      },
      "timeout": 60000
    }
  }
}
```
# 3. remote mcp server
如果工具支持配置remote server，可以直接配置
```conf
{
  "mcpServers": {
    "web-search": {
      "url": "https://remote.mcp.server/sse"
    }
  }
}
```
如果工具不支持配置remote server，则可以通过[mcp-remote](https://www.npmjs.com/package/mcp-remote)工具作为桥接，实现：
1. MCP客户端 --STDIO--> mcp-remote --HTTP/SSE--> 远程MCP服务器
2. **协议转换**：将远程的HTTP/SSE协议转换为本地的STDIO协议
3. **兼容性**：让不支持远程连接的MCP客户端也能使用远程服务器
```json
{
  "mcpServers": {
    "remote-example": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://remote.mcp.server/sse",
        "--header",
        "Authorization: Bearer ${AUTH_TOKEN}",
        "--allow-http"
      ],
      "env": {
        "AUTH_TOKEN": "..."
      }
    }
  }
}
```
