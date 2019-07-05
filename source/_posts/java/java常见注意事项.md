---
title: java常见注意事项
date: 2016-12-11 20:07:08
catagories:
- java
tags:
- java
- 常见问题
---

#  java常见注意事项

1. 变量作为类的成员使用时，java会确保给定其默认值，以保证所有属性都得到初始化，而局部变量则不会，在编译时java会返回一个错误

2. 使用类名引用static变量或方法，不仅仅强调了其static的结构，而且在某些情况下还可以方便编译器进行优化

3. main方法之所以能成为一个应用的入口点，static是一个很重要的保证，可以在不创建对象的情况下进行执行

4. main方法是可以抛出异常的，字符串参数数组的作用是接受命令行参数，参数直接用空格隔开

   （java ClassName  param1 param2 param3）

5. java使用javadoc工具(JDK安装的一部分)来提取注释，输出为html文件，只能为public和protected成员进行文档注释，private和default会被忽略

   <!--more-->

6. 对于一个较大的数，执行操作运算很可能结果就会溢出，而你不会受到出错或警告消息

```java
	public static void main(String[] args) {
		int bigNum = 2147483646;
		System.out.println(bigNum);//2147483646
		bigNum++;
		System.out.println(bigNum);//2147483647
		bigNum++;
		System.out.println(bigNum);//-2147483648
	}
```

7. 标识符由字母开头，这里的字幕并不是指简单的ABC，而是指任意的Unicode字符，在JDK1.7zhong ,允许数字中间加下划线进行分割

```java
	public static void 打印(){
		long x = 0xda_da;
		System.out.println(x);
	}
	public static void main(String[] args) {
		打印();
	}
```
8. 除NaN以外，浮点数集合中的所有元素都是有序的，从小到大的顺序将会是：负无穷、可数负数、正负零、可数正数、正无穷
注意，NaN是无须的，有且只有NaN这一个数在与自身相比时会得到false。`System.out.println(Float.NaN==Float.NaN);`的结
果将为false，任何其他值与其进行的等值比较都将得到fasle，不等值比较将得到true。







-----

未完待续。。。