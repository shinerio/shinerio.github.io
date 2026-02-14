# 1. select
`select` 语句会从上到下依次检查每个 `case` 的通信操作语句，每个case必须是一个通信操作，要么接收，要么发送。
- 如果发现某个 `case` 的通信操作可以立即执行，就会执行该 `case` 语句块并跳出 `select` 代码块。
- 如果多个 `case` 均可执行，则会随机选择一个执行。
- 如果没有任何一个 `case` 可以执行，则会执行 `default` 语句块(如果存在的话)。<span style="background:#fff88f">如果select语句带default并且放在无限循环 中，就会变成忙轮询（busy waiting），导致高CPU占用。</span>
- 如果没有default，select会被阻塞，goroutine会进入休眠状态，直到某个case满足条件。
```go
func main() {  
    // 无缓冲channel  
    chan1 := make(chan int)  
    chan2 := make(chan string)  
  
    // 有缓冲channel  
    chan3 := make(chan string, 5) // 缓冲区大小为5  
  
    var data = "test"  
    go func() {  
       for {  
          select {  
          // <-chan1 是一个接收操作符号。如果chan1通道中有数据可以读取，那么就会执行这个case并丢弃读到的数据（仅当做一种触发信号），如果当前没有数据可读，则不会阻塞，而是继续检查下一个case。  
          case <-chan1:  
             fmt.Println("receive from chan1.")  
          // 从chan3中读取数据赋值给tmp变量  
          case tmp := <-chan3:  
             fmt.Printf("receive from chan3, value %s\n", tmp)  
          // chan2 <- data 是一个发送操作符号，其中data是要发送的数据。如果chan2通道可以立即发送数据,那么就会执行这个case下面的代码块。如果当前通道已满无法发送，则不会阻塞，而是继续检查下一个case。  
          // 这里chan2未定义缓冲大小，如果没有其他goroutine从chan2中接收数据的会，这个发送动作会一直阻塞  
          // 如果要在无接收者的情况下实现往chan2中发送数据，则最好给chan2定义缓冲大小  
          case chan2 <- data:  
             fmt.Println("send data to chan2")  
          }  
       }  
    }()  
    // 持续向chan1发送数据，以触发select中的case  
    go func() {  
       for i := 0; i < 3; i++ {  
          chan1 <- i  
       }  
    }()  
  
    // 持续从chan2中接收数据，以触发select中的case  
    go func() {  
       for i := 0; i < 3; i++ {  
          var _ = <-chan2  
       }  
    }()  
  
    // 持续向chan3发送数据，以触发select中的case  
    go func() {  
       for i := 0; i < 5; i++ {  
          chan3 <- fmt.Sprintf("data%d", i)  
       }  
    }()  
  
    time.Sleep(time.Second * 10)  
  
    // 这里需要关闭chan，以防止goroutine泄漏  
    close(chan1)  
    close(chan2)  
    close(chan3)  
}

func main() {  
    ch := make(chan int)  
  
    go func() {  
       for i := 0; i < 3; i++ {  
          ch <- i  
       }  
       close(ch)  
    }()  
  
    // 从一个已经关闭的chan中获取数据不会阻塞，会得到0，如下代码会打印 Received:1 Received: 2 Received: 3，之后一直死循环打印Received: 0  
    //for {    // val := <-ch    // time.Sleep(time.Second)    // fmt.Println("Received:", val)    //}    // 从channel中获取数据时最好判断channel是否关闭了，除非你确定chan不会关闭  
    for {  
       // ok为bool类型，代表chan是否关闭  
       val, ok := <-ch  
       if !ok {  
          fmt.Println("Channel closed")  
          break  
       }  
       fmt.Println("Received:", val)  
    }  
}
```
超时判断
```go
func main() {  
    //比如在下面的场景中，使用全局resChan来接受response，如果时间超过3S,resChan中还没有数据返回，则第二条case将执行  
    var resChan = make(chan int)  
    // do request  
    select {  
    case data := <-resChan:  
       fmt.Println(data)  
    case <-time.After(time.Second * 3):  
       fmt.Println("request time out")  
    }  
}
```
# 2. for select case陷阱
在Go语言中，select语句用于在多个channel操作中进行选择，它本身不会导致CPU busy，但某些使用方式可能会造成高CPU占用。
## 2.1. 正确用法
如果select语句阻塞等待通道操作，Go运行时会让出CPU，避免忙等待
```go
func worker(ch chan int) {
    for {
        select {
        case val := <-ch:
            fmt.Println("Received:", val)
        }
    }
}
```
这里select会阻塞，直到ch有数据可读。阻塞时，Go运行时会让出CPU，不会造成busy waiting。
```css
  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND                                           
21381 devbox    20   0 1225400   2024   1276 S   0.0   0.0   0:00.00 main  
```
## 2.2. 错误用法
如果 select 语句在循环中不断轮询且没有阻塞，可能会导致高 CPU 占用。例如：
```go
func busyWorker(ch chan int) {
    for {
        select {
        case val := <-ch:
            fmt.Println("Received:", val)
        default:
            // 没有数据时，不做任何阻塞操作，导致无限循环
        }
    }
}
```
default分支会在没有数据可读时立即执行，导致for循环不停执行，CPU占用率飙高。
```css
  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND                                           
21941 devbox    20   0 1225400   2028   1276 R  99.0   0.0   0:13.83 main 
```
简单优化
```go
for {
    select {
    case val := <-ch:
        fmt.Println("Received:", val)
    default:
        time.Sleep(10 * time.Millisecond) // 让出 CPU，避免忙等待
    }
}
```
增加sleep，让出cpu调度
```css
  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND                                           
22872 devbox    20   0 1225656   2020   1276 S   0.7   0.0   0:00.03 main   
```
在Go语言的select语句中，如果 select 语句内包含default分支，并且所有其他 case 都没有准备好（没有数据可读或可写），那么default立即执行，不会阻塞。
# 3. for循环调度新协程
当在for循环中启动协程并使用循环变量时，所有协程可能最终会使用循环结束时变量的最终值，而不是启动协程时的值。这是因为：
1. **变量作用域**：循环变量在整个循环中是同一个变量（同一个内存地址）
2. **闭包捕获**：Go 协程创建了一个闭包，捕获的是变量的引用而非值
3. **执行时机**：协程可能在循环结束后才真正开始执行

**Go 1.22 之前**：循环变量在每次迭代中是重用的（相同的内存地址），会导致协程捕获到相同引用。
**Go 1.22 及以后**：默认情况下，每次迭代会为循环变量创建一个新的变量实例。这意味着在协程中捕获这些变量时，每个协程会捕获到不同的变量实例。

go 1.22之前错误示例：
```go
func main() {
    values := []int{1, 2, 3, 4, 5}
    
    for i, val := range values {
        go func() {
            // 错误：直接使用循环变量
            fmt.Printf("索引: %d, 值: %d\n", i, val)
        }()
    }
    
    time.Sleep(time.Second) // 等待协程执行
}
```
go 1.22版本以前输出示例：
```text
索引: 4, 值: 5
索引: 4, 值: 5
索引: 4, 值: 5
索引: 4, 值: 5
索引: 4, 值: 5
```