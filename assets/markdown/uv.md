# 1. 设置pip源
配置环境变量`UV_DEFAULT_INDEX=https://pypi.tuna.tsinghua.edu.cn/simple`
# 2. 设置cache位置
```poweshell
 [Environment]::SetEnvironmentVariable("UV_CACHE_DIR", "D:\workspace\develop\uvcache", "User")
```
# 3. 初始化项目并指定最低python版本
`uv init python 3.14`
# 4. 全局安装tool
如果安装Python包是为了在终端任何地方运行它的命令（比如 `black`, `flake8`, 或者你提到的 `claude-conversation-extractor`），可以使用 `uv tool install`：
```bash
uv tool install claude-conversation-extractor
```
- **效果：** 它会为这个工具创建一个隐藏的独立环境，但把它的**可执行命令**软链接到全局路径。
- **优点：** 你可以在任何文件夹直接输入命令使用，且永远不会产生依赖冲突。