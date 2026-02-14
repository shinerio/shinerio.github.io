# 1. 新建module-a
引入maven依赖
```xml
<dependency>  
    <groupId>org.apache.velocity</groupId>  
    <artifactId>velocity-engine-core</artifactId>  
</dependency>  
<dependency>  
    <groupId>com.google.auto.service</groupId>  
    <artifactId>auto-service</artifactId>  
</dependency>
```
自定义Annotation
```java
@Target(ElementType.TYPE)  
@Retention(RetentionPolicy.SOURCE)  
public @interface CodeGeneratorAnnotation {  
}
```
继承AbstractProcessor，实现自定义Processor
```java
@AutoService(Processor.class)  
@SupportedAnnotationTypes("com.example.CodeGeneratorAnnotation")  
public class CodeGenerator extends AbstractProcessor {
}
```
# 2. 新建module-b
添加依赖module-A

类填写注解，以生成编译后的class。`AlarmGenerator`可以添加些属性，用于编译class时使用。也可以给多个类添加注解以生成多份class.
```java
@AlarmGenerator  
public class AlarmGeneratedEntity {  
}
```

>velocity需要使用单独module，这样才能是processor先经过编译，这样再编译其他module的时候才能用上这个已经编译processor