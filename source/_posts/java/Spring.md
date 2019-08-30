---
title: spring及相关框架介绍
date: 2018-03-28
categories:
- java
tags:
- java
---

## **Spring及相关框架介绍**

---------

#### **Spring框架**

**Spring**是一个开发应用框架，具有`轻量级`、`非侵入式`、`一站式`、`模块化` 的特点，其目的是用于简化企业级应用程序开发。Spring框架图如下：

![Spring架构图](https://upload-images.jianshu.io/upload_images/788498-358a3764fcbca0e4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

Core Container模块，包含spring-beans、spring-core、spring-context、spring-expression四个方面。

-   **spring-core和spring-beans**提供了框架的基础部分，包括反转控制和依赖注入功能。其中Bean Factory是容器核心，本质是“**工厂设计模式**”的实现，而且无需编程实现“单例设计模式”，单例完全由容器控制，而且提倡面向接口编程，而非面向实现编程；所有应用程序对象及对象间关系由框架管理，从而真正把你从程序逻辑中把维护对象之间的依赖关系提取出来，所有这些依赖关系都由BeanFactory来维护。
-   **spring-context**这个模块建立在core和bean模块提供坚实的基础上，集成Beans模块功能并添加资源绑定、数据验证、国际化**、**Java EE支持、容器生命周期、事件传播等；核心接口是ApplicationContext。
-   **spring-expression**提供强大的表达式语言支持，支持访问和修改属性值，方法调用，支持访问及修改数组、容器和索引器，命名变量，支持算数和逻辑运算，支持从Spring 容器获取Bean，它也支持列表投影、选择和一般的列表聚合等。

AOP and Instrumentation模块，包含spring-aop、spring-instrument两个方面。

-   **spring-aop**Spring AOP模块提供了符合 *AOP Alliance*规范的面向方面的编程（aspect-oriented programming）实现，提供比如日志记录、权限控制、性能统计等通用功能和业务逻辑分离的技术，并且能动态的把这些功能添加到需要的代码中；这样各专其职，降低业务逻辑和通用功能的耦合。
-   **spring-instrument**在特定的应用程序服务器中支持类和类加载器的实现，比如Tomcat。

Messaging，从Spring  Framework  4开始集成了MessageChannel, MessageHandler等，用于消息传递的基础。

Data Access/Integration，包括了JDBC、ORM、OXM、JMS和事务管理。

事务模块：该模块用于Spring管理事务，只要是Spring管理对象都能得到Spring管理事务的好处，无需在代码中进行事务控制了，而且支持编程和声明性的事物管理。

-   **spring-jdbc** 提供了一个JBDC的样例模板，使用这些模板能消除传统冗长的JDBC编码还有必须的事务控制，而且能享受到Spring管理事务的好处。
-   **spring-orm** 提供与流行的“对象-关系”映射框架的无缝集成，包括Hibernate、JPA、Ibatiss等。而且可以使用Spring事务管理，无需额外控制事务。
-   **spring-oxm** 提供了一个对Object/XML映射实现，将java对象映射成XML数据，或者将XML数据映射成java对象，Object/XML映射实现包括JAXB、Castor、XMLBeans和XStream。
-   **spring-jms** 用于JMS(Java Messaging Service)，提供一套 “消息生产者、消息消费者”模板用于更加简单的使用JMS，JMS用于用于在两个应用程序之间，或分布式系统中发送消息，进行异步通信。

Web，包含了spring-web, spring-webmvc, spring-websocket, and spring-webmvc-portlet几个模块。

-   **spring-web** 提供了基础的web功能。例如多文件上传、集成IoC容器、远程过程访问（RMI、Hessian、Burlap）以及Web Service支持，并提供一个RestTemplate类来提供方便的Restful services访问。
-   **spring-webmvc** 提供了一个Spring MVC Web框架和REST Web服务的实现。Spring的MVC框架提供了领域模型代码和Web表单之间分离，并与Spring框架的所有其他功能集成。
-   **spring-webmvc-portlet** 提供了在Portlet环境中使用MVC实现，并且反映了spring-webmvc模块的功能。

--------

#### **Spring MVC框架**

Spring Web MVC是一种基于Java的实现了Web MVC设计模式的请求驱动类型的轻量级Web框架，即使用了MVC架构模式的思想，将web层进行职责解耦，基于请求驱动指的就是使用请求-响应模型。Spring MVC请求流程如下：

![](http://sishuok.com/forum/upload/2012/7/14/529024df9d2b0d1e62d8054a86d866c9__1.JPG)

具体执行步骤如下：

1.  首先用户发送请求——>前端控制器，前端控制器根据请求信息（如URL）来决定选择哪一个页面控制器进行处理并把请求委托给它，即以前的控制器的控制逻辑部分；上图中的1、2步骤；
2.  页面控制器接收到请求后，进行功能处理，首先需要收集和绑定请求参数到一个对象，这个对象在Spring Web MVC中叫命令对象，并进行验证，然后将命令对象委托给业务对象进行处理；处理完毕后返回一个ModelAndView（模型数据和逻辑视图名）；上图中的3、4、5步骤；
3.  前端控制器收回控制权，然后根据返回的逻辑视图名，选择相应的视图进行渲染，并把模型数据传入以便视图渲染；上图中的步骤6、7；
4.  前端控制器再次收回控制权，将响应返回给用户，上图中的步骤8；至此整个结束。

相关的配置文件：

前端控制器：**web.xml**，servlet-name——设置默认DispatcherServlet加载的自配置的Servlet，url-pattern——表示哪些请求交给Spring Web MVC处理， “/” 是用来定义默认servlet映射的

委托请求：**WEB-INF/xxxxx-servlet.xml** ，配置HandlerMapping（表示将请求的URL和Bean名字映射）、HandlerAdapter（哪些Bean可以作为Spring Web MVC中的处理器）

视图解析器/ViewResolver：**WEB-INF/xxxxx-servlet.xml**，InternalResourceViewResolver：用于支持Servlet、JSP视图解析；viewClass：JstlView表示JSP模板页面需要使用JSTL标签库，classpath中必须包含jstl的相关jar包；prefix和suffix：查找视图页面的前缀和后缀（前缀[逻辑视图名]后缀），比如传进来的逻辑视图名为hello，则该该jsp视图页面应该存放在“WEB-INF/jsp/hello.jsp”

--------

#### **Spring AOP**

AOP：Aspect-Oriented Programming 面对切片编程。AOP是OOP的补充。

AOP的应用场景如下：

-   事务处理
-   日志处理
-   异常处理
-   权限控制
-   系统性能监控
-   其他

Spring中AOP代理由Spring的IOC容器负责生成、管理，其依赖关系也由IOC容器负责管理。Spring创建代理的规则如下：

1.  默认使用**Java动态代理**来创建AOP代理，这样就可以为任何接口实例创建代理了
2.  当需要代理的类不是代理接口的时候，Spring会切换为使用**CGLIB代理**，也可强制使用CGLIB

