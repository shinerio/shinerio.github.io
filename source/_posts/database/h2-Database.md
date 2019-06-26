---
title: h2 Database
Date: 2019-06-26
categories:
- database
tags:
- database
---

H2是一个开源的嵌入式数据库引擎，采用java语言编写，不受平台限制，同时H2提供了一个十分方便的web控制台用于操作和管理数据库的内容。

<!--more-->

# 1. 使用方式

mavan中添加依赖

```xml
<properties>
  <h2.version>1.3.172</h2.version>
</properties>

<!--添加H2依赖-->
<dependency> 
  <groupId>com.h2database</groupId> 
  <artifactId>h2</artifactId> 
  <version>${h2.version}</version> 
  <scope>test</scope> 
</dependency>
```

# 2. 运行模式

H2 支持3中运行模式，[Database URL Overview](http://www.h2database.com/html/features.html#embedded_databases)

## 2.1 内嵌模式

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/database/h2embedded.png)



1. 内存模式

   数据库只在内存中运行，关闭连接后数据库将被清空，适合测试环境

   连接字符串：`jdbc:h2:men:DBName;DB_CLOSE_DELAY=-1`

   如果不指定DBName，则以私有方式启动，只允许一个连接

2. 持久化模式

   数据库持久化存储为单个文件

   连接字符串：`jdbc:h2:file:~/.h2/DBName;AUTO_SERVER=TRUE`

   ~/.h2/DBNAME表示数据库文件的存储位置，如果第一次连接则会自动创建数据库

## 2.2 服务器模式

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/database/h2Server.png)

H2目前支持三种服务器模式: web服务器模式，TCP服务器模式和PG服务器模式

1. Web server

   此种运行方式支持使用浏览器访问H2 Console

2. TCP server

   支持客户端/服务器端连接方式

3. PG server

   支持PostgreSQL客户端

## 2.3 混合模式

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/database/h2mixture.png)

第一个应用以内嵌的方式启动，对于后面的应用来说它是服务器模式跑着的

# 3. 启动服务模式

## 3.1 命令行模式

`java -cp h2*.jar org.h2.tools.Server`

执行如下命令，获取选项列表及默认值

`java -cp h2*.jar org.h2.tools.Server -?`

常见选项：

> - -web：启动支持H2 Console的服务
> - -webPort <port>：服务启动端口，默认为8082
> - -browser：启动H2 Console web管理页面
> - -tcp：使用TCP server模式启动
> - -pg：使用PG server模式启动

## 3.2 使用maven

```xml
<?xml version="1.0" encoding="UTF-8"?> <project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd"> 
  <modelVersion>1.0.0</modelVersion> 
  <version>1.0.0</version> 
  <groupId>groupid</groupId> 
  <artifactId>h2-console</artifactId> 
  <name>H2 Console</name> 
  <packaging>pom</packaging> 
  <properties> 
    <h2.version>1.3.172</h2.version> 
  </properties> 
  <dependencies> 
    <dependency> 
    <groupId>com.h2database</groupId> 
    <artifactId>h2</artifactId> 
    <version>${h2.version}</version> 
    <scope>runtime</scope> 
    </dependency> 
  </dependencies> 
  <build> 
      <plugins> 
          <plugin> 
            <groupId>org.codehaus.mojo</groupId> 
            <artifactId>exec-maven-plugin</artifactId> 
            <executions> 
                <execution> 
                    <goals> 
                        <goal>java</goal> 
                    </goals> 
                </execution> 
            </executions> 
            <configuration> 
                <mainClass>org.h2.tools.Server</mainClass> 
                <arguments>  
                    <argument>-web</argument> 
                    <argument>-webPort</argument>
                    <argument>8090</argument> 
                    <argument>-browser</argument> 
                    </arguments> 
            </configuration> 
        </plugin> 
    </plugins> 
  </build> 
</project>
```

在命令行中执行如下命令启动H2 Console
`mvn exec:java`

或者建立一个bat文件
`@echo offcall mvn exec:javapause`

此操作相当于执行了如下命令：
`java -jar h2-1.3.168.jar -web -webPort 8090 -browser`

# 4. 连接数据库

properties文件

```properties
#h2 database settings
jdbc.driver=org.h2.Driver
jdbc.url=jdbc:h2:file:~/.h2/quickstart;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1
jdbc.username=sa
jdbc.password=
#connection pool settings
jdbc.pool.maxIdle=5 
jdbc.pool.maxActive=40
```

spring配置

```xml
<beans profile="test"> 
    <context:property-placeholder ignore-resource-not-found="true" location="classpath*:/application.properties, classpath*:/application.test.properties" /> 

<!-- Spring Simple连接池 --> 
    <bean id="dataSource" class="org.springframework.jdbc.datasource.SimpleDriverDataSource">
        <property name="driverClass" value="${jdbc.driver}" /> 
        <property name="url" value="${jdbc.url}" /> 
        <property name="username" value="${jdbc.username}" /> 
        <property name="password" value="${jdbc.password}" /> 
    </bean> 

<!-- 初始化数据表结构 --> 
    <jdbc:initialize-database data-source="dataSource" ignore-failures="ALL"> 
        <jdbc:script location="classpath:sql/h2/schema.sql" /> 
        <jdbc:script location="classpath:data/h2/import-data.sql" encoding="UTF-8"/> 
    </jdbc:initialize-database> 
</beans>
```