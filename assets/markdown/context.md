go1.7加入了一个新的标准库context，用来简化对于处理单个请求的多个goroutine之间与请求域的数据、取消信号、截止时间等相关操作，这些操作可能涉及多个API调用。

<span style="background:#fff88f">当一个上下文被取消时，它派生的所有上下文也被取消</span>。当context生命周期结束时，可以从`ctx.Done()`管道接收消息，子协程可以判断后进行相应处理。
```go
func TestContext(t *testing.T) {  
    parentCtx := context.Background()  
    ctx, cancel := context.WithTimeout(parentCtx, 5*time.Second)  
    defer cancel() // 当函数返回时，确保上下文被取消，释放资源  
  
    go func() {  
       for {  
          select {  
          case <-time.After(time.Second):  
             fmt.Println("1 second after.")  
          case <-ctx.Done():  
             // 当超时发生或者外部取消时，这里会被触发  
             fmt.Println("operation cancelled:", ctx.Err())  
             return  
          }  
       }  
    }()  
  
    time.Sleep(time.Second * 6)  
}
```
主协程中通知子线程取消
```go
func TestCancelContext(t *testing.T) {  
    parentContext := context.Background()  
    ctx, cancel := context.WithCancel(parentContext)  
  
    group := sync.WaitGroup{}  
    group.Add(1)  
  
    go func(context context.Context) {  
       for {  
          select {  
          case <-ctx.Done():  
             fmt.Println("child exit.")  
             group.Done()  
             return  
          default:  
             time.Sleep(time.Second)  
             fmt.Println("1 second passed.")  
          }  
  
       }  
    }(ctx)  
  
    time.Sleep(6 * time.Second)  
    cancel()  
    group.Wait()  
    fmt.Println("main exit.")  
}
```
# 1. Backgroud和TODO
Go内置两个函数：`Background()`和`TODO()`，我们代码中最开始都是以这两个内置的上下文对象作为<span style="background:#fff88f">最顶层的partent context</span>，衍生出更多的子上下文对象。background和todo本质上都是emptyCtx结构体类型，是一个不可取消，没有设置截止时间，没有携带任何值的Context。
## 1.1. Background
Background()主要用于<span style="background:#fff88f">main函数</span>、初始化以及测试代码中，作为Context这个树结构的最顶层的Context，也就是根Context。
**使用场景**
- 作为所有`context`树的**顶层根节点**（例如：`main`函数、初始化逻辑、测试代码等）。
- 当没有现成的`context`可用时（比如处理请求的入口处）。
- 常用于启动后台任务或服务的初始化。
## 1.2. TODO()
这个函数也返回一个空的context，可以在不确定该用什么context，或者暂时还没有合适的context可用时，作为<span style="background:#fff88f">占位使用</span>。不过TODO可能在以后会被替换成具体的context，所以使用TODO的地方需要后续检查是否正确。比如在重构代码的时候，可能<span style="background:#fff88f">暂时用TODO标记，提醒以后处理</span>。在生产代码中，应该<font color="#ff0000">避免使用TODO</font>
**使用场景**
- 在代码重构或开发阶段，**临时占位**（例如：函数需要`context`参数，但调用方暂时无法提供合适的`context`）。
- 提醒后续需要替换为更明确的`context`（比如从父`context`派生或传递业务相关的值）。
# 2. With系列函数
此外，context包中还定义了四个With系列函数。
- `withCancel`，可以在父协程中调用返回的cancel函数取消子协程
- `WithDeadline`，和withCancel一样，但是有一个最长的生命周期限制，到达**绝对时间**后子上下文也会被取消，适用于在<font color="#ff0000">某个时间点</font>之前必须要执行完的任务。
- `WithTimeout`，和withDeadline类似，但是不是以绝对时间为准的，而是以函数被调用时刻为参考的相对时间，适用于执行<font color="#ff0000">限制任务的最大时长</font>。
- `withValue`，func WithValue(parent Context, key, val interface{}) Context
# 3. context中值传递的原则
- 父context不能获取子context新加的value（每新加一个value就会生成一个新的context）
- 父 Context中某个键对应的值被修改了，子Context可以获取到最新的值。这是因为 Context 中存储的值是通过引用来传递的，而不是通过值传递的方式。当我们使用 `context.WithValue` 函数创建一个新的子 Context 时，实际上是创建了一个新的 Context 对象，该对象包含了父 Context 中所有键值对的引用。建议context中存储不可变的对象，如果需要变，则可以通过全局变量控制。