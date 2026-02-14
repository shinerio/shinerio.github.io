Go语言标准库内置的testing测试框架提供了基准测试(benchmark)的能力，能让我们很容易地对某一段代码进行性能测试。

本文中会对斐波那契数列进行基准测试
```go
// fib.go
package main

func fib(n int) int {
	if n == 0 || n == 1 {
		return n
	}
	return fib(n-2) + fib(n-1)
}
```
创建一个基准测试用例
- Benchmark测试文件必须以filename加`_test`结尾
- 方法名必须以`Benachmark`开头
- 测试参数必须为`b *testing.B`
```go
// fib_test.go
package main

import "testing"

func BenchmarkFib(b *testing.B) {
	for n := 0; n < b.N; n++ {
		fib(30) // run fib(30) b.N times
	}
}
```
# 1. 执行benchmark测试用例
执行基准测试用例可以使用命令`go test -bench .`，这个命令会执行所有基准用例。
```shell
go test -bench .
goos: windows
goarch: amd64
pkg: go_test
cpu: AMD Ryzen 5 3600 6-Core Processor
BenchmarkFib-12              252           4840508 ns/op
PASS
ok      go_test 1.948s
```
输入结果含义如下：

| 名称      | 含义                           |
| ------- | ---------------------------- |
| goos    | 操作系统，这里是windows              |
| goarch  | CPU架构，这里是64位X86              |
| pkg     | package名，可以在测试的时候指定package   |
| cpu     | CPU的信息，这里可以看到是AMD Ryzen 5    |
| -12     | 代表cpu有12个核                   |
| 252     | 代表b.N的最大值为252                |
| 4840509 | 代表for循环了252次，平均每次的耗时约为4.84ms |

> [!question]
> benchmark用例的参数 `b *testing.B`，有个属性`b.N`表示这个用例需要运行的次数。`b.N` 对于每个用例都是不一样的，那这个值是如何决定的呢？

`b.N` 从1开始，如果该用例能够在 1s 内完成，`b.N` 的值便会增加，再次执行。`b.N` 的值大概以 1, 2, 3, 5, 10, 20, 30, 50, 100 这样的序列递增，越到后面，增加得越快。测试结果的输出是以最后一次运行超过1秒的结果为结论的，也就是预热阶段（b.N逐步增长）的耗时并不会被统计和呈现。
> [!note]
> 实际执行的时间是1.948s，比 benchtime的1s要长，测试用例编译、执行、销毁等是需要时间的。
# 2. ns/op计算
ns/op是通过如下公式计算得到：`总执行时间 ÷ 操作次数(b.N) = 每次操作平均时间`
在这个Go语言基准测试代码中，`for`循环是基准测试框架的必要部分。这个循环的目的是确保测试函数执行足够多次，以获得准确的性能测量结果。具体来说，`for n := 0; n < b.N; n++`这个循环有以下几个重要作用：
1. `b.N`是Go测试框架自动确定的循环次数。测试框架会动态调整这个值，以确保测试运行的总时间足够长，能够得到统计学上有意义的结果。
2. 通过多次执行相同的函数调用(`fib(30)`)，基准测试可以计算出平均执行时间，这比只执行一次更能准确反映函数的实际性能。
3. 这种方法能够消除或减少单次测量中可能出现的系统波动和干扰因素的影响。
4. 如果没有这个循环，基准测试只会执行一次`fib(30)`，最后得出来的ns/op会被缩小了b.N倍。

我们可以通过如下两个例子来理解for循环的作用。
```go
package test

import (
	"testing"
	"time"
)

func fib(n int) int {
	if n == 0 || n == 1 {
		return n
	}
	return fib(n-2) + fib(n-1)
}

func BenchmarkFib(b *testing.B) {
	for n := 0; n < b.N; n++ {
		time.Sleep(time.Duration(10) * time.Millisecond) // run fib(30) b.N times
	}
}
```
输出结果ns/op约等于10ms，符合预期
```shell
goos: darwin
goarch: amd64
pkg: go_test/test
cpu: Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz
BenchmarkFib
BenchmarkFib-8   	     100	  10519669 ns/op
PASS
```
如果把for循环删除
```go
package test  
  
import (  
    "testing"  
    "time")  
  
func fib(n int) int {  
    if n == 0 || n == 1 {  
       return n  
    }  
    return fib(n-2) + fib(n-1)  
}  
  
func BenchmarkFib(b *testing.B) {  
    time.Sleep(time.Duration(10) * time.Millisecond)  
}
```
输出如下，ns/op被正好缩小了1000000000倍
```shell
goos: darwin
goarch: amd64
pkg: go_test/test
cpu: Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz
BenchmarkFib
BenchmarkFib-8   	1000000000	         0.01012 ns/op
PASS
```
# 3. 命令参数
## 3.1. 匹配规则
- 在有多个Benchmark测试方法的时候，如何做到只运行指定的方法呢？
### 3.1.1. 指定package
1. 指定package：`go test -bench my-package`
2. 指定子package：`go test -bench my-package/sub-package`
3. 当前目录下的所有`package：go test -bench ./…` （斜杠左侧是一个点，右侧是三个点）
### 3.1.2. 指定方法
可以用正则表达式来指定方法名
1. 所有以Fib结尾的方法：`go test -bench='Fib$' benchmark-demo`
2. 所有以BenchmarkNew开始的方法：`go test -bench='^BenchmarkNew' benchmark-demo`
## 3.2. 指定cpu
我们仔细观察[[benchmark#1. 执行benchmark测试用例|步骤一]]的输出：
BenchmarkFib-12 中的 `-12` 即 `GOMAXPROCS`，默认等于CPU核数。可以通过`-cpu`参数改变`GOMAXPROCS`，`-cpu` 支持传入一个列表作为参数，例如：
```shell
go test -bench . -cpu=1 
goos: windows
goarch: amd64
pkg: go_test
cpu: AMD Ryzen 5 3600 6-Core Processor
BenchmarkFib-1               238           4724139 ns/op
PASS
ok      go_test 1.915s
```
在上面的例子中，改变CPU的核数对结果几乎没有影响，因为这个Fib的调用是串行的，不涉及并发编程，改造测试用例如下：
```go
package test

import (
	"sync"
	"testing"
)

func fib(n int) int {
	if n == 0 || n == 1 {
		return n
	}
	return fib(n-2) + fib(n-1)
}

func fib_sum(index int) int {
	count := 0
	wg := sync.WaitGroup{}
	lock := sync.Mutex{}
	// 算10遍
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			sum := fib(index)
			lock.Lock()
			count += sum
			lock.Unlock()
			wg.Done()
		}()
	}
	wg.Wait()
	return count
}

func BenchmarkFib(b *testing.B) {
	for i := 0; i < b.N; i++ {
		fib_sum(30)
	}
}
```
可以看出在使用了并发编程后，10个cpu的运行效率比单个cpu运行效率明显提高了。
```shell
go test -bench . -cpu=1 
goos: darwin
goarch: amd64
pkg: go_test/test
cpu: Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz
BenchmarkFib          21          53187164 ns/op
PASS
ok      go_test/test    1.745s

go test -bench . -cpu=10
goos: darwin
goarch: amd64
pkg: go_test/test
cpu: Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz
BenchmarkFib-10               76          15448673 ns/op
PASS
ok      go_test/test    1.785s
```
## 3.3. 测试时间与测试轮数
对于性能测试来说，提升测试准确度的一个重要手段就是增加测试的次数。我们可以使用 `-benchtime` 和 `-count` 两个参数达到这个目的。
### 3.3.1. benchtime
benchmark 的默认时间是 1s，那么我们可以使用 `-benchtime` 指定为 5s。例如：
```go
go test -bench . -benchtime=5s
goos: windows
goarch: amd64
pkg: go_test
cpu: AMD Ryzen 5 3600 6-Core Processor
BenchmarkFib-12             1201           4876905 ns/op
PASS
ok      go_test 6.615s
```
将 `-benchtime` 设置为 5s，用例执行次数也变成了原来的5倍，每次函数调用时间仍为 04.8ms作用，几乎没有变化（我们这个测试用例的执行与b.N没有关系）。

`-benchtime` 的值除了是时间外，还可以是具体的次数。例如，执行 30 次可以用 `-benchtime=30x`：
```go
go test -bench . -benchtime=30x
goos: windows
goarch: amd64
pkg: go_test
cpu: AMD Ryzen 5 3600 6-Core Processor
BenchmarkFib-12               30           4639033 ns/op
PASS
ok      go_test 0.417s

```
### 3.3.2. count
`-count` 参数可以用来设置 benchmark 的轮数。例如，进行3轮benchmark。
```shell
go test -bench . -benchtime=30x -count=3
goos: windows
goarch: amd64
pkg: go_test
cpu: AMD Ryzen 5 3600 6-Core Processor
BenchmarkFib-12               30           4907513 ns/op
BenchmarkFib-12               30           4996390 ns/op
BenchmarkFib-12               30           5041850 ns/op
PASS
ok      go_test 0.734s
```
# 4. 内存分配测试
`-benchmem` 参数可以度量内存分配的次数。内存分配次数也性能也是息息相关的，例如不合理的切片容量，将导致内存重新分配，带来不必要的开销。

在下面的例子中，`generateWithCap` 和 `generate` 的作用是一致的，生成一组长度为 n 的随机序列。唯一的不同在于，`generateWithCap` 创建切片时，将切片的容量(capacity)设置为n，这样切片就会一次性申请n个整数所需的内存。
```go
package Generate

import (
	"math/rand"
	"testing"
)

func generateWithCap(n int) []int {
	nums := make([]int, 0, n)
	for i := 0; i < n; i++ {
		nums = append(nums, rand.Int())
	}
	return nums
}

func generate(n int) []int {
	nums := make([]int, 0)
	for i := 0; i < n; i++ {
		nums = append(nums, rand.Int())
	}
	return nums
}

func BenchmarkGenerateWithCap(b *testing.B) {
	for n := 0; n < b.N; n++ {
		generateWithCap(1000000)
	}
}

func BenchmarkGenerate(b *testing.B) {
	for n := 0; n < b.N; n++ {
		generate(1000000)
	}
}
```
运行该用例的结果是：
```shell
go test -bench='Generate' .
goos: windows
goarch: amd64
pkg: go_test/Generate
cpu: AMD Ryzen 5 3600 6-Core Processor
BenchmarkGenerateWithCap
BenchmarkGenerateWithCap-12           88          12633669 ns/op
BenchmarkGenerate
BenchmarkGenerate-12                  62          17817368 ns/op
PASS
```
可以看到生成100w个数字的随机序列，`GenerateWithCap`的耗时比 `Generate`少很多。我们可以使用 `-benchmem` 参数看到内存分配的情况：
```shell
go test -bench . -benchmem 
goos: windows
goarch: amd64
pkg: go_test/Generate
cpu: AMD Ryzen 5 3600 6-Core Processor
BenchmarkGenerateWithCap-12           98          12146879 ns/op         8003645 B/op          1 allocs/op
BenchmarkGenerate-12                  58          17856278 ns/op        41678169 B/op         38 allocs/op
PASS
ok      go_test/Generate        2.459s
```
`Generate`分配的内存是`GenerateWithCap`的5倍，设置了切片容量，内存只分配一次，而不设置切片容量，内存分配了 40 次。
# 5. 测试函数时间和空间复杂度
不同的函数复杂度不同，O(1)，O(n)，O(n^2) 等，利用benchmark验证复杂度一个简单的方式，是构造不同的输入。对刚才的 benchmark 稍作改造，便能够达到目的。

对刚刚的例子进行稍加改造
```go
package main  
  
import (  
	"math/rand"  
	"testing"  
	"time"  
)  
  
func generate(n int) []int {  
	rand.Seed(time.Now().UnixNano())  
	nums := make([]int, 0)  
	for i := 0; i < n; i++ {  
		nums = append(nums, rand.Int())  
	}  
	return nums  
}  
func benchmarkGenerate(i int, b *testing.B) {  
	for n := 0; n < b.N; n++ {  
		generate(i)  
	}  
}  
  
func BenchmarkGenerate1000(b *testing.B)    { benchmarkGenerate(1000, b) }  
func BenchmarkGenerate10000(b *testing.B)   { benchmarkGenerate(10000, b) }  
func BenchmarkGenerate100000(b *testing.B)  { benchmarkGenerate(100000, b) }  
func BenchmarkGenerate1000000(b *testing.B) { benchmarkGenerate(1000000, b) }
```
可以看到时间复杂度和空间复杂度都是线性增长的，说明时间和空间复杂度都是`o(n)`
```shell
go test -bench . -benchmem
goos: windows
goarch: amd64
pkg: go_test/Generate
cpu: AMD Ryzen 5 3600 6-Core Processor
BenchmarkGenerate1000-12           49246             23597 ns/op           25208 B/op         12 allocs/op
BenchmarkGenerate10000-12           7395            169348 ns/op          357625 B/op         19 allocs/op
BenchmarkGenerate100000-12           646           1771936 ns/op         4101387 B/op         28 allocs/op
BenchmarkGenerate1000000-12           66          18853998 ns/op        41678114 B/op         38 allocs/op
PASS
ok      go_test/Generate        6.410s
```
# 6. 控制计时
- ResetTimer，如果在benchmark开始前，需要一些准备工作，如果准备工作比较耗时，则需要将这部分代码的耗时忽略掉，则可以在需要计时之前调用ResetTimer来重制计时
- StopTimer&StartTimer，如果在benchmark执行过程中，有些操作比较耗时，且不想参与计算，可以通过Stop&Start的方式，忽略掉中间部分的耗时。
# 7. 并行测试
前面的BenchmarkFib是常规的串行测试，如果被测试的方法在真实环境中存在并发调用，那么在基准测试中也应该通过并行测试来了解其基本性能（例如锁造成的阻塞）
```go
package main

import "testing"

func BenchmarkParallelFib(b *testing.B) {
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			fib(30)
		}
	})
}
```
执行结果
```shell
goos: windows
goarch: amd64
pkg: go_test
cpu: AMD Ryzen 5 3600 6-Core Processor
BenchmarkParallelFib
BenchmarkParallelFib-12             1663            621800 ns/op
PASS
```

## 7.1. b.RunParallel
这是 `*testing.B` 对象的一个方法，其作用是并行执行基准测试。它会启动多个goroutine来并行运行传入的函数。
- `b.RunParallel` 方法会尽力让基准测试以`GOMAXPROCS(CPU 核心数)`个并发来执行
- 可以通过`-cpu`命令来指定并发度
- 可以通过 `b.SetParallelism(p)` 来显式设置并发度。这会将并发 goroutine 的数量设置为 `p * GOMAXPROCS`
## 7.2. `func(pb *testing.PB){}`
这是一个匿名函数，会被并行执行。`pb *testing.PB`：`pb` 是`*testing.PB` 类型的指针，它是 `b.RunParallel` 方法提供的一个对象，用于控制并行基准测试的迭代。`pb.Next()`：这是 `*testing.PB` 对象的一个方法，它会返回一个布尔值。只要返回 `true`，就表明基准测试应该继续迭代。
- **循环控制**：它类似于普通基准测试中的 `i < b.N` 条件，返回一个布尔值表示是否继续执行下一次迭代。
- **计数机制**：Go 测试框架会确保所有并发goroutine总共执行的操作次数接近`b.N`。
- **动态分配**：与单线程测试不同，`b.N`的操作次数会被动态分配给多个goroutine，而 `pb.Next()`负责协调这一分配过程。
- **负载均衡**：测试框架会自动平衡各个goroutine之间的工作负载，避免某些 goroutine工作过多或过少。
> [!note]
> 在并发基准测试中也可以使用 `-benchtime` 标志来指定测试运行的时间或者次数。这个标志对并发测试和普通基准测试都有效。