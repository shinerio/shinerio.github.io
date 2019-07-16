---
title: Spring事务踩过的坑
date: 2019-07-16
categories:
- other
tags:
- java
- debug
- Spring
---

# 问题描述

项目中需要对一批数据进行批量拷贝，拷贝过程出现了异常，但是数据并没有进行回滚。

脱敏代码如下：

```java
@Component
public class MyService{
	@AutoWired
	private Myhandler myhandler;
	public void saveBatch(){
		MyContext myContext = applicationContext.getBean(MyContext.class);
		myhandler.saveBatch(myContext);	
	}
}

@Component
public class MyHandler{
	public void saveBathch(MyContext myContext){
			init(myContext);
			build(myContext);
			commit(myContext);
	}
	
	private void init(MyContext myContext){...}
	private void build(MyContext myContext){...}
  @Transactional(rollbackFor = Exception.class)
	public void commit(MyContext myContext){...} 
}
```

<!--more-->



# 问题解决(一)

## 1. 常见的JDBC事务提交方式:

- 设置数据库事务为非自动提交
- 执行sql
- 成功commit，异常rollback

```java
conn.setAutoCommit(false); // 取消自动提交
try{
  /**
	* 执行sql
	**/
  conn.commit(); // 提交事务
}catch(Exception e){
  //如果发生错误
	conn.rollback();
}
```

## 2. 代理模式

事务本身是一些通用且固定化的功能，如何避免在业务代码逻辑中都重复上面的步骤呢？一个很简单直接的解决思路就是使用代理模式，业务代码关注于核心逻辑，事务和业务分离，通过代理模式的方式对业务代码进行二次封装。Java中常见的代理模式有三种，静态代理，基于JDK的动态代理，基于CGLIB的动态代理。对于静态代理来说，我们需要为每个被代理类生成一个代理类，编码工作巨大，故不适用。使用JDK动态代理和CGLIB动态代理，可以在程序运行，生成字节码的时候动态生成代理类，关于这三者的详细区别这里不再赘述。

## 3. Spring AOP

Spring使用AOP的思想实现方法的切入，本质也是代理模式的一种实践，主要使用了JDK动态代理和CGLIB代理。Spring通过AOP的方式切入方法执行过程，对于使用`@Transactional` 注解的方法，Spring使用TransactionManager进行管理，在方法执行前开启事务，在方法执行成功后进行Commit，方法执行出现异常时进行回滚。

## 4. 修正

了解了Spring的原理这个问题其实就很好解决了，Spring使用AOP切面的方式管理事务，要想被Spring AOP切面的前提是使用了Spring的另一个特性IOC。一个对象只有通过IOC的方式被Spring管理，Spring才有能力接管对象生命周期，控制对象行为能力。**回顾一开始的代码，service调用来handler的public方法saveBatch，此方法会进行一些数据初始化和构建工作，然后调用事务方法commit进行事务执行，Spring通过了代理的方式来执行saveBatch，而对于被代理方法内部的细节其实是透明执行的，也就是说saveBatch内部的commit方法本身是通过被代理类来调用的，而不是代理类，也就是说Spring对于commit方法的调用不能实现AOP的拦截，无法实现代理，事务也就自然失效了，所以同一类中方法的调用，事务会失效。**实际进行调试过程中，我们可以发现MyHandler的saveBatch中的this指针是MyHandler本身，debug时通过step into commit方法时，实际执行commit方法主体是myHandler实例，而不是MyHandler的增强代理对象实例，所以自然无法被AOP切面，实现事务功能。

> 这里附带讲一个小细节，saveBatch方法不光是涉及到数据的存储，在数据存储之前需要进行大量的数据库查询以及数据构建工作，事务本身是一件资源占用比较严重的行为，所以能不用事务就不用事务，通过将一些查询和构建工作放到init和build方法中，将数据缓存在context中，通过commit方法进行集中提交，可以较少事务的力度，提高事务的效率。

了解了问题发生的原因，我们可以修改代码如下，将commit方法转移到MyContext中，这个saveBatch方法在调用被Spring管理的另一个类MyContext时，Spring可以通过AOP的方式切入到commit方法中执行事务。

```java
@Component
public class MyService{
	@AutoWired
	private Myhandler myhandler;
	public void saveBatch(){
		MyContext myContext = applicationContext.getBean(MyContext.class);
		myhandler.saveBatch(myContext);	
	}
}

@Component
public class MyHandler{
	public void saveBathch(MyContext myContext){
			init(myContext);
			build(myContext);
			myContext.commit();
	}
	private void init(MyContext myContext){...}
	private void build(MyContext myContext){...}
}

@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class MyContext{
   @Transactional(rollbackFor = Exception.class)
    public void commiy(){
    	//这里调用dao的方法将数据批量入库
    }
}
```

# 问题解决(二)

## 1. 问题排查

正常情况下，此时Spring事务到此应该是可以生效的，但是**本项目中还存在另一个大坑**。如果你觉得一个@Transactional注解就可以管理事务了，那么你就too young too simple，我们项目中的坑就是这么来的。

下面我们通过单步调试方式来分析。首先，commit方法正常进入了代理类内部执行逻辑，此时this指向`CglibAopProxy$DynamicAdvisedIntereptor`。

```java
public Object intercept(Object proxy, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {
  Object oldProxy = null;
  boolean setProxyContext = false;
  Class<?> targetClass = null;
  Object target = null;

  Object var15;
  try {
    if (this.advised.exposeProxy) {
      oldProxy = AopContext.setCurrentProxy(proxy);
      setProxyContext = true;
    }
    // 获取被代理类
    target = this.getTarget();
    if (target != null) {
      targetClass = target.getClass();
    }     
    // 获取代理方法需要代理执行的interceptors，使用@Transaction声明了一个事务拦截器
    // chain = [TransactionInterceptor]
    List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(method, targetClass);
    Object retVal;
    // 对于普通方法来说，直接执行被代理方法
    if (chain.isEmpty() && Modifier.isPublic(method.getModifiers())) {
      Object[] argsToUse = AopProxyUtils.adaptArgumentsIfNecessary(method, args);
      retVal = methodProxy.invoke(target, argsToUse);
    } else {
      // 对于需要进行切面处理的方法，通过代理类使用链式方法来执行，代理类持有chain
      retVal = (new CglibAopProxy.CglibMethodInvocation(proxy, target, method, args, targetClass, chain, methodProxy)).proceed();
    }

    retVal = CglibAopProxy.processReturnType(proxy, target, method, retVal);
    var15 = retVal;
  } finally {
    if (target != null) {
      this.releaseTarget(target);
    }

    if (setProxyContext) {
      AopContext.setCurrentProxy(oldProxy);
    }

  }
  return var15;
}
```

代理类执行方法

```java
//org.springframework.aop.framework.ReflectiveMethodInvocation.java
public Object proceed() throws Throwable 
		// 执行完chain中所有interceptor，调用真正被代理类方法
    if (this.currentInterceptorIndex == this.interceptorsAndDynamicMethodMatchers.size() - 1) {
        return this.invokeJoinpoint();
    } else {
    		// 获取chain中下一个interceptor
        Object interceptorOrInterceptionAdvice = this.interceptorsAndDynamicMethodMatchers.get(++this.currentInterceptorIndex);
        if (interceptorOrInterceptionAdvice instanceof InterceptorAndDynamicMethodMatcher) {
            InterceptorAndDynamicMethodMatcher dm = (InterceptorAndDynamicMethodMatcher)interceptorOrInterceptionAdvice;
            return dm.methodMatcher.matches(this.method, this.targetClass, this.arguments) ? dm.interceptor.invoke(this) : this.proceed();
        } else {
            return ((MethodInterceptor)interceptorOrInterceptionAdvice).invoke(this);
        }
    }
}
```

对于TransactionInterceptor，` ((MethodInterceptor)interceptorOrInterceptionAdvice).invoke(this)`方法进入TransactioInterceptor内部`invoke方法`

```java
public Object invoke(final MethodInvocation invocation) throws Throwable {
  Class<?> targetClass = invocation.getThis() != null ? AopUtils.getTargetClass(invocation.getThis()) : null;
  // 通过事务的方式来执行方法
  return this.invokeWithinTransaction(invocation.getMethod(), targetClass, new InvocationCallback() {
    public Object proceedWithInvocation() throws Throwable {
      return invocation.proceed();
    }
  });
}

protected Object invokeWithinTransaction(Method method, Class<?> targetClass, final TransactionAspectSupport.InvocationCallback invocation) throws Throwable {
  // TransactionAttribute的实现中存储了注解中的信息，包括rollback，qualifier，descriptor(方法描述)
  final TransactionAttribute txAttr = this.getTransactionAttributeSource().getTransactionAttribute(method, targetClass);
  // 获得TransactionManager，实际的事务管理器
  final PlatformTransactionManager tm = this.determineTransactionManager(txAttr);
  final String joinpointIdentification = this.methodIdentification(method, targetClass, txAttr);
  Object result;
  if (txAttr != null && tm instanceof CallbackPreferringPlatformTransactionManager) {
    final TransactionAspectSupport.ThrowableHolder throwableHolder = new TransactionAspectSupport.ThrowableHolder();

    try {
      result = ((CallbackPreferringPlatformTransactionManager)tm).execute(txAttr, new TransactionCallback<Object>() {
        public Object doInTransaction(TransactionStatus status) {
          TransactionAspectSupport.TransactionInfo txInfo = TransactionAspectSupport.this.prepareTransactionInfo(tm, txAttr, joinpointIdentification, status);

          Object var4;
          try {
            Object var3 = invocation.proceedWithInvocation();
            return var3;
          } catch (Throwable var8) {
            if (txAttr.rollbackOn(var8)) {
              if (var8 instanceof RuntimeException) {
                throw (RuntimeException)var8;
              }

              throw new TransactionAspectSupport.ThrowableHolderException(var8);
            }

            throwableHolder.throwable = var8;
            var4 = null;
          } finally {
            TransactionAspectSupport.this.cleanupTransactionInfo(txInfo);
          }

          return var4;
        }
      });
      if (throwableHolder.throwable != null) {
        throw throwableHolder.throwable;
      } else {
        return result;
      }
    } catch (TransactionAspectSupport.ThrowableHolderException var18) {
      throw var18.getCause();
    } catch (TransactionSystemException var19) {
      if (throwableHolder.throwable != null) {
        this.logger.error("Application exception overridden by commit exception", throwableHolder.throwable);
        var19.initApplicationException(throwableHolder.throwable);
      }

      throw var19;
    } catch (Throwable var20) {
      if (throwableHolder.throwable != null) {
        this.logger.error("Application exception overridden by commit exception", throwableHolder.throwable);
      }

      throw var20;
    }
  } else {
    // 开启事务
    TransactionAspectSupport.TransactionInfo txInfo = this.createTransactionIfNecessary(tm, txAttr, joinpointIdentification);
    result = null;

    try {
      // 执行被代理方法
      result = invocation.proceedWithInvocation();
    } catch (Throwable var16) {
      // 异常回滚
      this.completeTransactionAfterThrowing(txInfo, var16);
      throw var16;
    } finally {
      // 清理事务
      this.cleanupTransactionInfo(txInfo);
    }
		// 提交事务
    this.commitTransactionAfterReturning(txInfo);
    return result;
  }
}
```

调试过程中发现，commit发生发生异常时，确实进入了completeTransactionAfterThrowing方法中，并且执行了rollback方法，按理说异常数据应该被回滚了，**但是！！！数据并没有回滚，而是被commit了**

## 2. TransactionManager、SessionFactory、DataSource

他们三者都是一对一的关系，一个SessionFactory管理一个DataSource的session，一个TransactionManager管理一个DataSource的事务。

- DataSource

  DataSource中维护了数据库连接的一些信息，指定了数据源

- SessionFactory

  SessionFactory用来维护数据库连接中的会话，充当DataSource的代理。

- TransactionManager

  管理实务，负责事务的begin，commit和rollback

## 3. 发现问题

既然事务的主体是`TransactionManager`， 那么我们就深入分析它。TransactionManager中持有DataSource数据源，调时过程发现DataSource数据源为`DemoADataSource`，问题出现了，实际我们我们操作的数据源应该是`DemoBDataSource`。查询项目配置，项目配置了多数据源，存在两份`DataSourceConfig` , 也就是项目中存在两组`DataSoure-SessionFactory-TransactionManager` 。问题出现了，项目有两个TransactionManger，Spring如何知道方法上应该使用哪一个TransactionManger呢。

TransactionInterceptor源码中发现通过`final PlatformTransactionManager tm = this.determineTransactionManager(txAttr)` 获得TransactionManager。

```java
protected PlatformTransactionManager determineTransactionManager(TransactionAttribute txAttr) {
  if (txAttr != null && this.beanFactory != null) {
    // 获得qualifier
    String qualifier = txAttr.getQualifier();
    if (StringUtils.hasText(qualifier)) {
      // 根据qulifier名称决定使用哪一个TransactionManager
      return this.determineQualifiedTransactionManager(qualifier);
    } else if (StringUtils.hasText(this.transactionManagerBeanName)) {
      return this.determineQualifiedTransactionManager(this.transactionManagerBeanName);
    } else {
      // 如果qulifier为空，使用defaultTransactionManager
      PlatformTransactionManager defaultTransactionManager = this.getTransactionManager();
      if (defaultTransactionManager == null) {
        defaultTransactionManager = (PlatformTransactionManager)this.transactionManagerCache.get(DEFAULT_TRANSACTION_MANAGER_KEY);
        if (defaultTransactionManager == null) {
          defaultTransactionManager = (PlatformTransactionManager)this.beanFactory.getBean(PlatformTransactionManager.class);
          this.transactionManagerCache.putIfAbsent(DEFAULT_TRANSACTION_MANAGER_KEY, defaultTransactionManager);
        }
      }

      return defaultTransactionManager;
    }
  } else {
    return this.getTransactionManager();
  }
}
```

**所以问题的关键是如何设置qualifier！！！**

qualifier是从TransactionAttribute中获得的，TransactionAttribute通过`final TransactionAttribute txAttr = this.getTransactionAttributeSource().getTransactionAttribute(method, targetClass)`得到。

```java
//org.springframework.transaction.interceptor.AbstractFallbackTransactionAttributeSource.java

private final Map<Object, TransactionAttribute> attributeCache = new ConcurrentHashMap(1024);

public TransactionAttribute getTransactionAttribute(Method method, Class<?> targetClass) {
  if (method.getDeclaringClass() == Object.class) {
    return null;
  } else {
    // 使用被代理类的被代理方法生成key，从attributeCache中获得TransactionAttribute，TransactionAttribute中包括rollback，qualifier，descriptor(方法描述)等信息
    Object cacheKey = this.getCacheKey(method, targetClass);
    Object cached = this.attributeCache.get(cacheKey);
    if (cached != null) {
      return cached == NULL_TRANSACTION_ATTRIBUTE ? null : (TransactionAttribute)cached;
    } else {
      TransactionAttribute txAttr = this.computeTransactionAttribute(method, targetClass);
      if (txAttr == null) {
        this.attributeCache.put(cacheKey, NULL_TRANSACTION_ATTRIBUTE);
      } else {
        String methodIdentification = ClassUtils.getQualifiedMethodName(method, targetClass);
        if (txAttr instanceof DefaultTransactionAttribute) {
          ((DefaultTransactionAttribute)txAttr).setDescriptor(methodIdentification);
        }

        if (this.logger.isDebugEnabled()) {
          this.logger.debug("Adding transactional method '" + methodIdentification + "' with attribute: " + txAttr);
        }

        this.attributeCache.put(cacheKey, txAttr);
      }

      return txAttr;
    }
  }
}

// 计算TransactionAttribute并放入Map中
protected TransactionAttribute computeTransactionAttribute(Method method, Class<?> targetClass) {
  if (this.allowPublicMethodsOnly() && !Modifier.isPublic(method.getModifiers())) {
    return null;
  } else {
    Class<?> userClass = ClassUtils.getUserClass(targetClass);
    Method specificMethod = ClassUtils.getMostSpecificMethod(method, userClass);
    specificMethod = BridgeMethodResolver.findBridgedMethod(specificMethod);
    TransactionAttribute txAttr = this.findTransactionAttribute(specificMethod);
    if (txAttr != null) {
      return txAttr;
    } else {
      // 从方法的注解中获得信息，从@Transcatio注解中的value获得qualifier的值
      txAttr = this.findTransactionAttribute(specificMethod.getDeclaringClass());
      if (txAttr != null && ClassUtils.isUserLevelMethod(method)) {
        return txAttr;
      } else {
        if (specificMethod != method) {
          txAttr = this.findTransactionAttribute(method);
          if (txAttr != null) {
            return txAttr;
          }

          txAttr = this.findTransactionAttribute(method.getDeclaringClass());
          if (txAttr != null && ClassUtils.isUserLevelMethod(method)) {
            return txAttr;
          }
        }

        return null;
      }
    }
  }
}
```

问题到这里就差不多解决了，Spring根据@Transaction的value值设置qualifier，继而决定使用哪一个TransactionManager。问题的出现是我们没有设置value值，Spring默认选择使用了defaultTransactionManager，defaultTransactionManager由声明顺序决定，第一个声明的TransactionManager就是default，项目中DemoA设置在前，所以在不指定value的情况下使用了demoATransactionManager，和需要操作的数据源demoBDataSource不匹配，自然也就无法管理事务，回滚异常也是自然的。

# 解决方案

指定使用demoBTranscationManager，问题的解决很简单，但是背后的原理以及排查过程却是充满挑战且有意义的

```java
@Component
public class MyService{
	@AutoWired
	private Myhandler myhandler;
	public void saveBatch(){
		MyContext myContext = applicationContext.getBean(MyContext.class);
		myhandler.saveBatch(myContext);	
	}
}

@Component
public class MyHandler{
	public void saveBathch(MyContext myContext){
			init(myContext);
			build(myContext);
			myContext.commit();
	}
	@Transactional(rollbackFor = Exception.class)
	private void init(MyContext myContext){...}
	private void build(MyContext myContext){...}
}

@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class MyContext{
    @Transactional(value = "demoBTransactionManager", rollbackFor = Exception.class)
    public void commiy(){
    	//这里调用dao的方法将数据批量入库
    }
}
```

# 总结

- Spring AOP和IOC是两大特性，两大特性密不可分，提供了强大功能

- Spring AOP生效的原则是使用了代理，使用代理的前提是:

  - 不能在一个类内部方法调用自己的另一个事务方法，代理只能代理一层
  - 基于JDK代理的方法只能代理接口方法，所以只能是public，方法不能被static，private，protected，final修饰(接口也不能被这些修饰)

  - 基于CGLIB代理的方法可以代理普通类方法

- Spring默认使用JDK动态代理，在无法使用JDK的普通类上Spring使用CGLIB做代理

- Spring使用代理模式来实现AOP

- Spring AOP增强代理类，涉及多个interceptor的执行，使用责任链模式

- 配置多DataSource数据源的工程，使用事务时应指定TransactionManager，单数据源最好也指定一下，以防以后配置多数据源留下隐患

- 事出反常必有妖，源码阅读是良策。