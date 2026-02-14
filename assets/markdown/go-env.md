
```shell
go env //打印Go所有默认环境变量
go env GOPATH //打印指定环境变量的值
```

# 1. GOROOT与GOPATH
- 环境变量`GOROOT`表示 Go 语言的安装目录。在`Windows`中，`GOROOT`的默认值是`C:/go`，而在`Mac OS`或`Linux`中`GOROOT`的默认值是`usr/local/go`，如果将Go安装在其他目录中，而需要将GOROOT的值修改为对应的目录。另外，`GOROOT/bin`则包含Go为我们提供的工具链，因此，应该将`GOROOT/bin`配置到环境变量 PATH 中，方便我们在全局中使用 Go 工具链。
	- Go 的编译器（`go` 命令）。
	- **标准库**：Go 官方自带的库，比如 `fmt` (打印), `net/http` (网络), `os` (系统操作) 等。这些代码就在 GOROOT 里。
	- 文档和工具链。
- `GOPATH`的值<font color="#ff0000">不能</font>与`GOROOT`相同。环境变量`GOPATH`用于指定我们的开发工作区 (workspace)，用于存放**代码**、**下载的第三方包**以及**编译后的工具**。在`类Unix`(Mac OS 或 Linux) 操作系统中`GOPATH`的默认值是`$home/go`。而在 Windows 中 GOPATH 的默认值则为 %USERPROFILE%\go(比如在 Admin 用户，其值为 C:\Users\Admin\go)。当然，我们可以通过修改GOPATH来更换工作区，`export GOPATH=/root/gopath`
	- **`bin/`**：存放编译后生成的可执行文件（例如安装了 `air` 或 `dlv` 工具，它们就在这）
	- **`pkg/`**：存放编译好的库文件，以及最重要的 **Module Cache**（`pkg/mod`，你 `go get` 下来的第三方依赖全都在这）。
	- **`src/`**：存放源代码。（_注意：在 Go Modules 模式下，你的项目代码不再强制要求放在这里，可以放在电脑任意位置_）。

```shell
export GOROOT=/usr/local/go
export PATH=$PATH:$GOROOT/bin
```

在 Go 1.11 版本之前，`GOPATH` 的地位非常死板，你写的所有项目代码**必须**放在 `%GOPATH%/src` 目录下，否则编译器找不到。
**现在（Go 1.11+ 及 Go Modules 模式）：**
1. **项目位置自由了**：你的项目代码可以放在电脑的任意位置（比如桌面、D盘根目录等），**不再强制**放在 `GOPATH/src` 下。
2. **GOPATH 依然重要**：虽然代码不用放里面了，但 `GOPATH` 依然用于：
    - 存储下载的依赖包（在 `GOPATH/pkg/mod`）。
    - 存储 `go install` 安装的命令行工具（在 `GOPATH/bin`）。
> go 1.11通过设置一个环境变量`GO111MODULE=on`就可以启用，并且go 1.12正式退出，而环境变量`GO111MODULE=on`就可以去掉了。
# 2. GOOS与GOARCH
GOOS 的默认值是我们当前的操作系统， 如果windows，linux，darwin（代表mac os ）。 GOARCH 则表示CPU架构，如 386，amd64，arm等。
```shell
# 获取当前 GOOS 和 GOARCH 的值。
go env GOOS GOARCH
```
## 2.1. GOOS 和 GOARCH 的取值范围
GOOS 和 GOARCH 的值成对出现，而且只能是下面列表对应的值。
```shell
$GOOS	    $GOARCH
android	    arm
darwin	    386
darwin	    amd64
darwin	    arm
darwin	    arm64
dragonfly   amd64
freebsd	    386
freebsd	    amd64
freebsd	    arm
linux	    386
linux	    amd64
linux	    arm
linux	    arm64
linux	    ppc64
linux	    ppc64le
linux	    mips
linux	    mipsle
linux	    mips64
linux	    mips64le
linux	    s390x
netbsd	    386
netbsd	    amd64
netbsd	    arm
openbsd	    386
openbsd	    amd64
openbsd	    arm
plan9	    386
plan9	    amd64
solaris	    amd64
windows	    386
windows	    amd64
```
## 2.2. 交叉编译
编译在64位Linux操作系统上运行的目标程序
```shell
GOOS=linux GOARCH=amd64 go build main.go
```
编译arm架构Android操作上的目标程序
```shell
GOOS=android GOARCH=arm GOARM=7 go build main.go
```

> [!tip]
> 交叉编译，是指在一个平台上就能生成可以在另一个平台运行的代码，例如，我们可以 32 位的 Windows 操作系统开发环境上，生成可以在 64 位 Linux 操作系统上运行的二进制程序。在其他编程语言中进行交叉编译可能要借助第三方工具，但在Go语言进行交叉编译非常简单，最简单只需要设置GOOS和GOARCH这两个环境变量就可以了。

# 3. 内网环境适用配置

| 变量名        | 默认值                             | 主要功能         | 典型使用场景                               |
| ---------- | ------------------------------- | ------------ | ------------------------------------ |
| GOPROXY    | https://proxy.golang.org,direct | 指定模块代理服务器URL | 1. 加速依赖下载<br>2. 访问缓存仓库<br>3. 企业内网镜像库 |
| GOSUMDB    | sum.golang.org                  | 指定校验数据库地址    | 模块完整性验证                              |
| GOPRIVATE  | 无                               | 通配符设置私有模块路径  | 1. 私有仓库<br>2. 跳过代理和校验                |
| GONOPROXY  | 无                               | 指定不走代理的模块路径  | 企业内网直连的模块                            |
| GONOSUMDB  | 无                               | 指定不校验的模块路径   | 私有模块跳过checksum检查                     |
| GOINSECURE | 无                               | 允许非安全访问的模块路径 | 1. 使用HTTP的仓库<br>2. 自签名证书             |

## 3.1. GOPROXY
- 支持逗号分隔的代理列表（包含关键字`direct`）
- 支持`off`禁用代理（强制直连）
- 支持文件协议（file:///path/to/local/cache）
```shell
go env -w GOPROXY="https://proxy1,https://proxy2,direct"
```
## 3.2. GONOPROXY
- 明确指定哪些模块不经过GOPROXY代理
- 与GOPRIVATE有重叠时，取并集
go get → 检查模块路径是否匹配GONOPROXY
    是 → 直连下载
    否 → 使用GOPROXY代理
```shell
go env -w GONOPROXY="git.internal.com/*,github.com/team/*"
```
## 3.3. GOINSECURE
- 允许使用HTTP协议访问指定模块
- 跳过TLS证书验证
- 仍然会进行sumdb校验（除非配合GONOSUMDB）
```shell
go env -w GOINSECURE="*.corp.com,private.repo/secret"
```
## 3.4. GONOSUMDB
- 跳过指定模块的checksum验证
- 安全警告：关闭校验将失去模块完整性验证
适用于企业内网私有模块（无法连接sum.golang.org）
```shell
go env -w GONOSUMDB="gitlab.com/group/*"
```
## 3.5. GOPRIVATE
等效于以下三个设置
- GONOPROXY=$GOPRIVATE
- GONOSUMDB=$GOPRIVATE
- GOINSECURE=$GOPRIVATE
当与其他变量冲突时，GOPRIVATE的配置会被拆分覆盖
```shell
go -w GOPRIVATE="*.corp.com,github.com/secret-project"
```

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250228002207580.png)
