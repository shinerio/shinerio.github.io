从 Go 1.11开始，Go引入了Go Modules作为官方的依赖管理解决方案。在Go Modules模式下，依赖项会被下载到`$GOPATH/pkg/mod`目录下，`go install`命令默认会将可执行文件安装到`$GOPATH/bin`目录下。`go.mod`文件位于项目根目录下，用于记录项目的模块信息和依赖项及其版本，一个典型的例子如下：
```go
module github.com/shinerio/cusmodule
go 1.16
require (
	github.com/cenk/backoff v2.2.1+incompatible
	github.com/coreos/bbolt v1.3.3
	github.com/edwingeng/doublejump v0.0.0-20200330080233-e4ea8bd1cbed
	github.com/stretchr/objx v0.3.0 // indirect
	github.com/stretchr/testify v1.7.0
	go.etcd.io/bbolt v1.3.6 // indirect
	go.etcd.io/etcd/client/v2 v2.305.0-rc.1
	go.etcd.io/etcd/client/v3 v3.5.0-rc.1
	golang.org/x/net v0.0.0-20210610132358-84b48f89b13b // indirect
	golang.org/x/sys v0.0.0-20210611083646-a4fc73990273 // indirect
)
exclude (
	go.etcd.io/etcd/client/v2 v2.305.0-rc.0
	go.etcd.io/etcd/client/v3 v3.5.0-rc.0
)
retract (
    v1.0.0 // 废弃的版本，请使用v1.1.0
)
```
# 1. go mod命令
```
download    download modules to local cache
edit        edit go.mod from tools or scripts
graph       print module requirement graph
init        initialize new module in current directory
tidy        add missing and remove unused modules
vendor      make vendored copy of dependencies
verify      verify dependencies have expected content
why         explain why packages or modules are needed
```
# 2. module path
go.mod的第一行是module path, 一般采用仓库+module name的方式定义。这样我们获取一个module的时候，就可以到它的仓库中去查询，或者让go proxy到仓库中去查询。
```shell
module github.com/shinerio/cusmodule
```
如果你的版本已经大于等于2.0.0，按照Go的规范，你应该加上major的后缀，module path改成下面的方式:
```shell
module github.com/shinerio/cusmodule/v2
module github.com/shinerio/cusmodule/v3
```
而且引用代码的时候，也要加上`v2`、`v3`、`vx`后缀，以便和其它major版本进行区分。这是一个很奇怪的约定，带来的好处是你一个项目中可以使用依赖库的不同的major版本，它们可以共存。
# 3. go directive
第二行是go directive。格式是 `go 1.xx`，它并不是指你当前使用的Go版本，而是指名你的代码所需要的Go的最低版本。因为Go的标准库也有所变化，一些新的API也被增加进来，如果你的代码用到了这些新的API，你可能需要指名它依赖的go版本。
# 4. require
require段中列出了项目所需要的各个依赖库以及它们的版本，除了正规的`v1.3.0`这样的版本外，还有一些奇奇怪怪的版本和注释。
## 4.1. indirect注释
```go
	golang.org/x/net v0.0.0-20210610132358-84b48f89b13b // indirect
	golang.org/x/sys v0.0.0-20210611083646-a4fc73990273 // indirect
```
有些库后面加了`indirect`后缀，代表间接的使用了这个库，但是又没有被列到某个go.mod中。下面的情况之一就会对这个库加indirect后缀：
- 当前项目依赖A，但是A的go.mod遗漏了B,那么就会在当前项目的go.mod中补充B，加indirect注释
- 当前项目依赖A，但是A没有go.mod，同样就会在当前项目的go.mod中补充B，加indirect注释
- 当前项目依赖A，A又依赖B，当对A降级的时候，降级的A不再依赖B，这个时候B就标记indirect注释
## 4.2. incompatible
有些库后面加了incompatible后缀，但是你如果看这些项目，它们只是发布了v2.2.1的tag，并没有`+incompatible`后缀。
```go
github.com/cenk/backoff v2.2.1+incompatible
```
这些库采用了go.mod的管理，但是不幸的是，虽然这些库的版major版本已经大于等于2了，但是他们的module path中依然没有添加v2、v3这样的后缀。所以go module把它们标记为`incompatible`的，虽然可以引用，但是实际它们是不符合规范的。
# 5. exclude
如果你想在你的项目中跳过某个依赖库的某个版本，你就可以使用这个段。
```go
exclude (
	go.etcd.io/etcd/client/v2 v2.305.0-rc.0
)
```
这样，Go在版本选择的时候，就会主动跳过这些版本，比如你使用`go get -u ......`或者`go get github.com/xxx/xxx@latest`等命令时，会执行version query的动作，这些版本不在考虑的范围之内。
# 6. replace
replace也是常用的一个手段，用来解决一些错误的依赖库的引用或者调试依赖库。
```go
replace github.com/coreos/bbolt => go.etcd.io/bbolt v1.3.3
replace github.com/panicthis/A v1.1.0 => github.com/panicthis/R v1.8.0
replace github.com/coreos/bbolt => ../R
```
比如etcd v3.3.x的版本中错误的使用了github.com/coreos/bbolt作为bbolt的module path，其实这个库在它自己的go.mod中声明的module path是go.etcd.io/bbolt，又比如etcd使用的grpc版本有问题，你也可以通过replace替换成所需的grpc版本。

甚至你觉得某个依赖库有问题，自己fork到本地做修改，想调试一下，你也可以替换成本地的文件夹。

replace可以替换某个库的所有版本到另一个库的特定版本，也可以替换某个库的特定版本到另一个库的特定版本。
# 7. retract
retract是go 1.16中新增加的内容，借用学术界期刊撤稿的术语，宣布撤回库的某个版本。如果你误发布了某个版本，或者事后发现某个版本不成熟，那么你可以推一个新的版本，在新的版本中，声明前面的某个版本被撤回，提示大家都不要用了。撤回的版本tag依然还存在，go proxy也存在这个版本，所以你如果强制使用，还是可以使用的，否则这些版本就会被跳过。和exclude的区别是retract是这个库的owner定义的， 而exclude是库的使用者在自己的go.mod中定义的。
# 8. vendor目录
Go 还支持使用 `vendor` 目录来管理依赖。可以通过执行 `go mod vendor` 命令，将项目所有依赖项复制到项目根目录下的 `vendor` 目录中。当使用 `-mod=vendor` 标志进行编译时，Go 会优先从 `vendor` 目录中查找依赖项，而非从 `$GOPATH/pkg/mod` 或 `GOMODCACHE` 中查找。示例命令如下
```
go build -mod=vendor
```
# 9. ref
https://colobu.com/2021/06/28/dive-into-go-module-1/
