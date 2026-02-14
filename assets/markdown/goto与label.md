Go语言也支持label(标签)语法：分别是`break label`和 `goto label` 、`continue label`。
- break label可以跳出label层级循环
- continue label可以从label继续下一次循环
- goto可以无条件的跳转执行的位置，但是**不能跨函数**，需要配合标签使用
```go
package gotocase

import (
	"fmt"
	"testing"
)

func TestGoto(t *testing.T) {
	fmt.Println(1)
	goto three     //跳转  
	fmt.Println(2) // 这行将会被跳过
three:
	fmt.Println(3)
}
```
执行结果
```
=== RUN   TestGoto
1
3
--- PASS: TestGoto (0.00s)
PASS
```

```go
func TestGoto1(t *testing.T) {
one:
	fmt.Println(1)
	goto one     //跳转
	fmt.Println(2) // 这行将会被跳过

	fmt.Println(3)
}
// 循环打印1
```

```go
func TestBreak(t *testing.T) {
OUTER:
	for {
		fmt.Println(1)
		for {
			fmt.Println(2)
			break OUTER
		}
	}
	fmt.Println(3)
}
// 依次打印1 2 3
```

```go
func TestContinue(t *testing.T) {
	a := 1
Label:
	for a < 5 {
		if a == 3 {
			a++
			//fmt.Println(a)
			continue Label
		}
		fmt.Println(a)
		a++
	}
}
```

输出结果
```go
1
2
4
```