# 1. 声明和初始化
## 1.1. 仅声明（未初始化）
`var ch chan int` 声明一个 int 类型的 channel，但未初始`
- `ch` 是 `nil`，不能直接使用，否则会引发 `panic`。
- 必须用 `make()` 进行初始化后才能使用。
## 1.2. 使用 `make()` 初始化
`ch := make(chan int)` 创建一个无缓冲 channel
- `ch` 现在可以用于发送和接收数据。
- **无缓冲 channel**：发送操作会阻塞，直到有 goroutine 读取数据。
## 1.3. 创建带缓冲的 channel
`ch := make(chan int, 3)`  创建一个容量为3的缓冲channel
- 可以**存储最多 `3` 个元素**，在缓冲区满之前，发送不会阻塞。
 - 适用于**生产者-消费者**模型，减少goroutine之间的阻塞等待。
## 1.4. 结合 `var` 进行初始化
`var ch chan int = make(chan int)` 声明并初始化`
`ch := make(chan int)` 等效，但 `var` 方式可以显式定义类型。
## 1.5. 使用 `struct{}` 类型的 channel
`ch := make(chan struct{})`
- `struct{}` 是一个空结构体，不占用内存。 
- 常用于**通知**（如关闭信号、同步 goroutine ）。
# 2. 只读、只写、读写通道
可以通过`chan<-`或`<-chan`的方式定义单向通道，一般用于方法入参
```go
package main  
  
import "fmt"  
  
// writeOnly chan<- 定义的chan作为入参，只有写权限  
func writeOnly(value string, ch chan<- string) {  
    ch <- value  
}  
  
// writeOnly <-chan 定义的chan作为入参，只有读权限  
func readOnly(ch <-chan string) {  
    fmt.Println(<-ch)  
}  
  
// readAndWrite chan 定义的入参同事具有读写权限  
func readAndWrite(ch chan string) {  
    ch <- "hello"  
    fmt.Println(<-ch)  
}  
  
func main() {  
    ch := make(chan string, 1)  
    writeOnly("hello", ch)  
    readOnly(ch)  
    readAndWrite(ch)  
}
```
# 3. 非缓冲通道
需要注意的是，程序中必须同时有不同的goroutine对**非缓冲通道**进行发送和接收操作，否则会造成阻塞。
```go
// TestNoBufferChannel fatal error: all goroutines are asleep - deadlock!  
func TestNoBufferChannel1(t *testing.T) {
	ch := make(chan string) // no buffer
	defer close(ch)
	ch %3C- "hello world"
	fmt.Println(<-ch)
}

// hello world
func TestNoBufferChannel2(t *testing.T) {
	ch := make(chan string)
	close(ch)
	defer go func() {
		ch <- "hello world"
	}()
	fmt.Println(<-ch)
}>)
```
# 4. 缓冲通道
缓冲通道可以在同一个 goroutine 内接收容量范围内的数据，即便没有另外的 goroutine 进行读取操作。
```go
ch := make(chan string, 2) // bufferd channel     缓冲通道
ch <- "a"
ch <- "b"
```
可以利用通道的阻塞能力，不关心通道的值，等待通道有数据后，进行下一步操作，如
```go
// 阻塞等待上下文执行，以便执行后续步骤
<-mainCtx.Done()
```
# 5. channel遍历和关闭
close() 函数可以用于关闭 channel，关闭后的 channel 中如果有缓冲数据，依然可以读取，但是无法再发送数据给已经关闭的channel，可以从已经关闭的channel获取数据，但是会获得零（如果channel类型是string，则是空字符串）。
```go
// 0 1 2 3 4 5 6 7 8 9 read from closed channel 0
func TestIterateClosedChannel(t *testing.T) {
	ch := make(chan int, 10)
	for i := 0; i %3C 10; i++ {
		ch <- i
	}
	close(ch)

	for v := range ch {
		fmt.Printf("%d ", v)
	}
	fmt.Printf("read from closed channel %d\n", <-ch)
}
```