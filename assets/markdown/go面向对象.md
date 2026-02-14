# 1. 自定义数据类型
增强代码可读性
```go
type city string  
  
func main() {  
    beijing := city("北京")  
    shanghai := city("上海")  
    fmt.Println(beijing)  // 北京  
    fmt.Println(shanghai) // 上海
}8
```
# 2. 方法接收器
只有自定义类型(或内置类型)才能够绑定方法，从而获得面向对象的特性。例如,为`type User struct {...}` 绑定 `func (u User) Name() string {...}` 方法。,使得User对象实现了Name方法。
```go
type User struct {  
    name string  
    age  int32  
}  
  
func (u User) Name() string {  
    return u.name  
}  
  
func main() {  
    userA := User{  
       name: "jack",  
       age:  10,  
    }  
  
    fmt.Println(userA.Name()) // jack  
}
```
在Go语言中，接口的实现是隐式的，也就是说只要一个自定义类型实现了接口中声明的所有方法，那么它就被认为实现了该接口，无需显式声明。这种隐式实现的方式，让接口的使用变得非常灵活。
```go
// Shape 接口是一种抽象类型,它定义了一组方法签名,但不包含实现代码  
type Shape interface {  
    Area() float64  
    Perimeter() float64  
}  
  
// Rectangle 实现了接口中声明的所有方法，那么它就被认为实现了该接口  
type Rectangle struct {  
    Width, Height float64  
}  
  
func (r Rectangle) Area() float64 {  
    return r.Width * r.Height  
}  
  
func (r Rectangle) Perimeter() float64 {  
    return 2 * (r.Width + r.Height)  
} 

type Square struct {  
    edgeSize float64  
}  
  
func (r Square) Area() float64 {  
    return r.edgeSize * r.edgeSize  
}
  
func printInfo(shape Shape) {  
    fmt.Println(shape.Area())      // 200  
    fmt.Println(shape.Perimeter()) // 60  
}  
  
func main() {  
    myRectangle := Rectangle{  
       Width:  10.0,  
       Height: 20.0,  
    }  
    printInfo(myRectangle)  
    
	mySquare := Square{  
	    edgeSize: 10,  
	}  
	// Cannot use 'mySquare' (type Square) as the type Shape Type does not implement 'Shape'  
	printInfo(mySquare)
}
```
