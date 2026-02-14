`lsof`（List Open Files）是一个用于列出系统中打开文件的工具。这里的 “文件” 是一个广义的概念，包括常规文件、目录、块设备、字符设备、共享库、网络套接字等。`lsof`会列出系统中当前用户打开的所有文件。

`-p <pid>`： 列出指定进程 ID 的进程打开的文件
`-u  <username>`：列出指定用户打开的文件
`-c <command>`: 列出正在执行指定命令的进程打开的文件
`-i [protocol][@hostname|hostaddr][:service|port]`: 示例：`lsof -i TCP:80`

如果要查看fd的创建时间，则可以进入`/proc/${pid}/fd/$fdid`查看文件的创建时间