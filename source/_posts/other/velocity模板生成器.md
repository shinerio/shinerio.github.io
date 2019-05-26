---
title: velocity模板生成器
date: 2017-3-30 23:03:32
categories:
- other
tags:
- 工具
---

# Velocity简介

Velocity 是一个基于 Java 的模板引擎框架，提供的模板语言可以使用在 Java 中定义的对象和变量上。Velocity 是 Apache 基金会的项目，开发的目标是分离 MVC 模式中的持久化层和业务层，是一种用来减少软件开发人员重复劳动的方法，让程序员将更多的精力放在业务逻辑以及其他更加具有创造力的工作上。

<!--more-->

# Hello Velocity

```java
public class HelloVelocity {
    public static void main(String args[]){
        VelocityEngine engine = new VelocityEngine();
        engine.setProperty(RuntimeConstants.RESOURCE_LOADER,"classpath");
        engine.setProperty("classpath.resource.loader.class", ClasspathResourceLoader.class.getName());
        try {
            engine.init();
            Template t = engine.getTemplate("hellovelocity.vm");
            VelocityContext context = new VelocityContext();
            context.put("name", "Velocity");
            Date date = new Date();
            DateFormat df = new SimpleDateFormat("yyyy年-MM月-dd天-HH时-mm分");
            context.put("date",df.format(date));
            List<String> temp = new ArrayList<String>();
            temp.add("1");
            temp.add("2");
            context.put("list",temp);
            StringWriter sw  = new StringWriter();
            t.merge(context,sw);
            System.out.print(sw.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

在 HelloVelocity 的代码中，首先 new 了一个 VelocityEngine 类，这个类设置了 Velocity 使用的一些配置，在初始化引擎之后就可以读取 hellovelocity.vm 这个模板生成的 Template 这个类。之后的 VelocityContext 类是配置 Velocity 模板读取的内容。这个 context 可以存入任意类型的对象或者变量，让 template 来读取。这个操作就像是在使用 JSP 开发时，往 request 里面放入 key-value，让 JSP 读取一样。

接下来就是写 hellovelocity.vm 文件了，这个文件实际定义了 Velocity 的输出内容和格式。hellovelocity.vm 的内容如下：

```
welcome $name to velocity.com
today is $date.
#foreach ($l in $list)
$l
#end
#set($Compliment="good!")
$Compliment
```

输出结果

```
welcome Velocity to velocity.com
today is 2017年-03月-31天-15时-13分.
1
2
good!
```

# 语法介绍

Velocity中关键字以#开头，而所有变量以$开头

### 变量

变量的简略标记是有一个前导"$"字符后跟一个 VTL 标识符（Identifier.）组成。一个VTL 标识符必须以一个字母开始(a .. z或 A .. Z)。剩下的字符将由以下类型的字符组成：

字母 (a .. z, A .. Z),数字 (0 .. 9),连字符("-"),下划线 ("_")

- 变量定义

  ```
  set($name="velocity")
  set($Name-single="velocity")
  set($name_single="velocity")
  st($name_f123="velocity")
  set($name123="velocity")
  ```

  $name等将被解析为velocity

  当使用#set 指令时，括在双引号中的字面字符串将解析和重新解释，如下所示：

  ```
  #set( $directoryRoot = "www" )
  #set( $templateName = "index.vm" )
  #set( $template = "$directoryRoot/$templateName" )
  $template

  ```

  输出将会是：

  ```
  www/index.vm

  ```

  然而，当字面字符串括在单引号中时，他将不被解析：

  ```
  #set( $foo = "bar" )
  $foo
  #set( $blargh = '$foo' )
  $blargh

  ```

  输出是：

  ```
  Bar
  $foo
  ```

- 变量的使用

  在模板文件中使用`$name` 或者`${name}` 来使用定义的变量。推荐使用`${name}`这种格式，因为在模板中同时可能定义了类似$name 和$names 的两个变量，如果不选用大括号的话，引擎就没有办法正确识别names 这个变量。

  对于一个复杂对象类型的变量，例如`$person`，可以使用`${person.name}` 来访问 person 的 name 属性。值得注意的是，这里的`${person.name}` 并不是直接访问 person 的 name 属性，而是访问 person 的 getName() 方法，所以`${person.name}` 和`${person.getName()}` 是一样的。

  使用`$!name`或者`$!{name}`,name为空时将会输出空字符串

  ```
  $foo
  $foo.getBar()
  ## is the same as
  $foo.Bar
  $data.getUser("jon")
  ## is the same as
  $data.User("jon")
  $data.getRequest().getServerName()
  ## is the same as
  $data.Request.ServerName
  ## is the same as
  ${data.Request.ServerName}
  ```

- 变量赋值

  在第一小点中，定义了一个变量，同时给这个变量赋了值。对于 Velocity 来说，变量是弱数据类型的，可以在赋了一个 String 给变量之后再赋一个数字或者数组给它。可以将以下六种数据类型赋给一个 Velocity 变量：变量引用, 字面字符串, 属性引用, 方法引用, 字面数字, 数组列表。

  ```
  #set($foo = $bar)
  #set($foo =“hello”)
  #set($foo.name = $bar.name)
  #set($foo.name = $bar.getName($arg))
  #set($foo = 123)
  #set($foo = [“foo”,$bar])
  ```

### 循环

类似于java中增强for循环

```
#foreach($element in $list)
 This is $element
 $velocityCount
#end
```

list中的元素会逐个赋值给element,velocity用来循环计数（从1开始）

### 条件语句

```
#if(condition)
...
#elseif(condition)
…
#else
…
#end
```

注意else和if之间不存在空格

### 关系操作符

&&，||和！

```
#if($case1 && $case2)
#end
```

### 宏

定义语法

```
#macro(macroName arg1 arg2 …)
...
#end
```

调用语法

```
#macroName(arg1 arg2 …)
```

举例

```
#macro(sayHello $name)
hello $name
#end
#sayHello(“velocity”)
```

输出的结果为 hello velocity

### parse和include

\#parse 和 #include 指令的功能都是在外部引用文件，而两者的区别是，#parse 会将引用的内容当成类似于源码文件，会将内容在引入的地方进行解析，#include 是将引入文件当成资源文件，会将引入内容原封不动地以文本输出。分别看以下例子：

foo.vm 文件：

```
#set($name =“velocity”)
```

parse.vm：

```
#parse(“foo.vm”)
```

输出结果为：velocity

include.vm：

```
#include(“foo.vm”)
```

输出结果为：#set($name =“velocity”)

### 注释

- 单行注释

  ```
  ## This is a single line comment.
  ```

- 多行注释

  ```
  #*
  	This is a muti-line comment.
  	The velocity Templating Engine will ignore it.
  *#
  ```

- 注释块，用来存储文档作者、版本信息

  ```
  #**
  This is a comment block 
  information 
  @author shinerio
  @version 1.0
  *#
  ```

### 其他运算

Velocity 有一些内建的数学功能，可以使用set指令用在模版中。下面的共识分别演示了加减乘除运算：

```
#set( $foo = $bar + 3 )
#set( $foo = $bar - 4 )
#set( $foo = $bar * 6 )
#set( $foo = $bar / 2 )

```

当进行除法运算时，结果将会是整数。When a division operation is performed, the result will be an integer. 余数则可以通过模(%)运算获得。

```
#set( $foo = $bar % 5 )

```

在Velocity 中，只有整数可以进行数学运算；如果执行非整数的数学运算，将被记录下来，并返回null 。

> 参考文档：
>
> <a href="https://www.ibm.com/developerworks/cn/java/j-lo-velocity1/">参考文档1</a>
>
> <a href=""https://wizardforcel.gitbooks.io/velocity-doc/content/1.html>中文API</a>

