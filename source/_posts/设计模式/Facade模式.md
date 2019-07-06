---
title: facade模式
date: 2019-07-02
categories:
- 设计模式
tags:
- 设计模式
- java
---

门面模式是对象的结构模式，外部与一个子系统的通信必须通过一个统一的门面对象进行。门面模式提供一个高层次的接口，使得外部不需要感知内部各种子系统的细节，通过统一的门面对象进行交互。

<!--more-->

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20190702153926.png)

# 示例

```java
public class Fridge{
  public void turnOff(){ 
  }
}
public class Television{
  public void turnOff(){ 
  }
}
public class Computer{
  public void turnOff(){ 
  }
}
//不使用门面模式，关闭所有电器
 public static void main(String[] args) {
 		new Computer().turnOffComputer();
 		new Fridge().turnOffFridge();
		 new Television().turnOffTV();
 // 当然了，一个正常的家庭不单单只有这么点电器的。
 // 如果某一天我想关闭家里所有的电器，就需要单独调用其turn offer方法
 } 
//使用门面模式
public class ElectricBrake {
   private Computer computer = new Computer();
   private Fridge fridge = new Fridge();
   private Television television = new Television();

   // 关闭所有电器
   public void turnOffAll() {
          computer.turnOffComputer();
          fridge.turnOffFridge();
          television.turnOffTV();
   }
} 
public static void main(String[] args) {
 		ElectricBrake brake = new ElectricBrake();
    brake.turnOffAll();
} 
```

# 优点

减少了系统之间的依赖关系，所有的依赖都是对门面对象的依赖，与子系统无关



