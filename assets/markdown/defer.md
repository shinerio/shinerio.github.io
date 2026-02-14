1. 关键字 defer 用于注册延迟调用。
2. 这些调用直到return前才被执。因此，可以用来做资源清理。
3. 多个defer语句，按先进后出的方式执行。
4. defer语句中的变量，在defer声明时就决定了，`defer`语句中的<span style="background:#fff88f">函数调用参数会在`defer`语句执行时立即求值，并保存下来</span>。这意味着如果在`defer`语句和函数返回之间修改了参数的值，`defer`语句中的函数调用将使用修改前的值。
5. 多个defer注册，哪怕函数或某个延迟调用发生错误，这些调用依旧会被执行。
```go
package main  
  
func deferPrint(x int) {  
    str := "a"  
    defer println(str)  
    str = "aa"  
    defer println("b")  
  
    defer func() {  
       println(100 / x) // div0 异常未被捕获，逐步往外传递，最终终止进程。  
    }()  
  
    defer println("c")  
}  
  
func main() {  
    deferPrint(0)  
}
// c
// b
// a
// panic: runtime error: integer divide by zero
```
