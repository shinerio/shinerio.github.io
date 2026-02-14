# 1. 集合
增加 了 List.of()、Set.of()、Map.of() 和 Map.ofEntries()等工厂方法来创建不可变集合。
```java
List<Integer> list = List.of(1, 2, 3, 4, 5);  
Set<Integer> set = Set.of(1, 2, 3, 4, 5);  
Map<String, Integer> map = Map.of("a", 1, "b", 2, "c", 3, "d", 4);
```
# 2. 私有方法
java8中允许接口有默认方法，java9中允许接口有默认私有方法
# 3. Optioal的ifPresentOrElse
```java
Optional.of(1).ifPresentOrElse(  
        System.out::println,  
        () -> System.out.println("not exist.")  
);
```
# 4. 类型推断
类型只是个语法糖，定义的变量在编译期就必须确定类型，不能用作函数入参或返回值
```java
var map = Map.of("a", 1);  
var str = "hello";
```
# 5. instanceof模式匹配
```java
public static void testType(Object str) {  
    if (str instanceof String s) {  
        System.out.println("string is " + s);  
    } else if (str instanceof Integer i) {  
        System.out.println("integer is " + i);  
    }  
}
```
# 6. switch表达式扩展
引入了类似lambda语法条件，支持多值匹配，匹配成功后的执行块不需要break
```java
for (int i = 0; i < 10; i++) {  
    switch (i) {  
        case 0,1,8,9 -> System.out.println("i小于2或大于7");  
        default -> System.out.println("i大于等于2且小于等于7");  
    }  
}
/**
i小于2或大于7
i小于2或大于7
i大于等于2且小于等于7
i大于等于2且小于等于7
i大于等于2且小于等于7
i大于等于2且小于等于7
i大于等于2且小于等于7
i大于等于2且小于等于7
i小于2或大于7
i小于2或大于7
**/
```
swich作为表达式
```java
var score = 'C';  
String s = switch (score){  
    case 'A' -> "优秀";  
    case 'B' -> "良好";  
    case 'C' -> {  
        System.out.println("do something");  
        // 通过yield返回值  
        yield "中";  
    }  
    case 'D' -> "及格";  
    case 'F' -> "不及格";  
    default -> "成绩输入错误";  
};  
```
1. 和`instanceof` 一样， `switch` 也紧跟着增加了类型匹配自动转换功能。
2. case可以匹配null
```java
// Old code  
static String formatter(Object o) {  
    String formatted = "unknown";  
    if (o == null) {  
        formatted = "null";  
    } else if (o instanceof String s) {  
        formatted = String.format("String %s", s);  
    } else if (o instanceof Integer i) {  
        formatted = String.format("int %d", i);  
    } else if (o instanceof Long l) {  
        formatted = String.format("long %d", l);  
    } else if (o instanceof Double d) {  
        formatted = String.format("double %f", d);  
    } else {  
        formatted = o.toString();  
    }  
    if (o instanceof Integer i) {  
        formatted = String.format("int %d", i);  
    } else if (o instanceof Long l) {  
        formatted = String.format("long %d", l);  
    } else if (o instanceof Double d) {  
        formatted = String.format("double %f", d);  
    } else if (o instanceof String s) {  
        formatted = String.format("String %s", s);  
    }  
    return formatted;  
}  
  
// New code  
static String formatterPatternSwitch(Object o) {  
    return switch (o) {  
        case null -> "null";  
        case Integer i -> String.format("int %d", i);  
        case Long l    -> String.format("long %d", l);  
        case Double d  -> String.format("double %f", d);  
        case String s  -> String.format("String %s", s);  
        default        -> o.toString();  
    };  
}
```
# 7. 文本块
```java
var str = """  
        this is the first line        
        this is the second line        
        this is the third line        
        """;  
var json = """  
        {             
            "firstName": "Piotr",            
             "lastName": "Mińkowski"        
         }        
         """;
/**
编译后结果
String str = "this is the first line\nthis is the second line\nthis is the third line\n";  
String json = "{\n     \"firstName\": \"Piotr\",\n     \"lastName\": \"Mińkowski\"\n}\n";
**/
```

# 8. record类
```java
public record Point(int x, int y) {  
    public Point(int x, int y) {  
        // 这是我们编写的Compact Constructor:  
        if (x < 0 || y < 0) {  
            throw new IllegalArgumentException();  
        }  
        // 这是编译器继续生成的赋值代码:  
        this.x = x;  
        this.y = y;  
    }  
  
    // 可以自定义成员方法或静态方法  
    public static Point of(int x, int y) {  
        return new Point(x, y);  
    }  
}
```
等效于下面这个类
1. 它是一个`final`类
2. 自动实现`equals`、`hashCode`、`toString`函数
3. 自动生成filed()方法获取成员属性
```java
final class Point extends Record {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int x() {
        return this.x;
    }

    public int y() {
        return this.y;
    }

    public String toString() {
        return String.format("Point[x=%s, y=%s]", x, y);
    }

	@Override  
	public boolean equals(Object o) {  
	    if (this == o) return true;  
	    if (o == null || getClass() != o.getClass()) return false;  
	    Point point = (Point) o;  
	    return x == point.x && y == point.y;  
	}  
	  
	@Override  
	public int hashCode() {  
	    return Objects.hash(x, y);  
	}
}
```
测试输出
```java
Point point1 = Point.of(1, 2);  
Point point2 = Point.of(1, 2);  
System.out.println(point1);  
System.out.println(point1.equals(point2));
/**
Point[x=1, y=2]
true
**/
```
# 9. 密封类

| 关键字          | 作用          | 继承限制              |
| ------------ | ----------- | ----------------- |
| `sealed`     | 限制继承为指定子类   | 仅允许`permits`列表中的类 |
| `non-sealed` | 解除密封，允许自由继承 | 无限制               |
| `final`      | 禁止任何继承      | 不可被继承             |
## 9.1. sealed
- **限制继承/实现**：`sealed`类或接口只能被指定的子类继承（类）或实现（接口）。
- **明确层级结构**：通过`permits`子句列出所有允许的直接子类 / 实现类，确保继承关系可控。
```java
// 定义一个sealed接口，仅允许Circle和Rectangle实现
public sealed interface Shape permits Circle, Rectangle, ColorfulShape {
    double area();
}

// 具体实现类必须声明为final、sealed或non-sealed
public final class Circle implements Shape { ... }
public sealed class Rectangle implements Shape permits Square { ... }
```
如果允许扩展的子类和封闭类在同一个源代码文件里，封闭类可以不使用 permits 语句，Java 编译器将检索源文件，在编译期为封闭类添加上许可的子类。
```java
package com.shinerio.tutorial.jdk;

public sealed class ColorfulShape implements Shape {
    static final class CircleColorfulShape extends ColorfulShape {
    }
}

final class RectangleColorfulShape extends ColorfulShape {
}
```
## 9.2. non-sealed
- **解除密封限制**：允许`sealed`类的子类被其他类继续继承（即打破`sealed`的封闭性）。
```java
// Rectangle是sealed类，但允许Square继承
public sealed class Rectangle implements Shape permits Square { ... }

// Square声明为non-sealed，允许其他类继续继承
public non-sealed class Square extends Rectangle { ... }

// 其他类可以继承Square
public class ColoredSquare extends Square { ... }
```