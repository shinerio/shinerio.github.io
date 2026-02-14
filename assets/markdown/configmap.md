# 1. 创建
## 1.1. 通过kubectl命令行创建
### 1.1.1. --from-file参数从文件中进行创建
```shell
# kubectl create configmap NAME --from-file=[key=]source --from-file=[key=]source
kubectl create configmap application.yml --from-file=server.xml
```
其中key=是可选的，默认key就是文件名，通过key=可以指定key。
### 1.1.2. --from-file参数从目录中进行创建
目录下每个配置文件名都被设置为key，文件的内容设成为value，语法如下：
```shell
# kubectl create configmap NAME --from-file=config-files-dir
kubectl create configmap spring-config --from-file=/etc/config
```
### 1.1.3. --from-literal直接指定key=value
```shell
kubectl create configmap NAME --from-literal=key1=value1 --from-literal=key2=value2
```
## 1.2. 通过yaml文件创建
指定key,value形式
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: spring-appvars
data:
  apploglevel: info
  appdatadir: /var/data
```
指定配置文件
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
	  name: spring-configfiles
data:
  application.yml: |
    server:
      port: 8081
    spring:
      profiles:
        active: prod
```
# 2. 使用
容器应用对configMap使用有以下两种方法
- 通过环境变量获取configMap中的内容
- 通过volume挂载的方式将configmap中的内容挂载为容器内部的文件或目录
## 2.1. 通过环境变量方式使用
创建configMap
```shell
kubectl create configmap active-profile --from-literal=active_profile=prod
```
定义Pod并引用configMap
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: spring-k8s-test
spec:
  containers:
    - name: spring-test
      image: kimb88/hello-world-spring-boot
      ports:
        - containerPort: 8080
	  envFrom:
	    - configMapRef:
	        name: active-profile
```
查看容器环境变量
```bash
root@spring-k8s-test:/usr/local/tomcat# echo $active_profile
prod
```
### 2.1.1. spring配置文件使用环境变量
在spring中可以通过`${key:defaultValue}`的方式直接引用系统的环境变量
```yaml
server:
  port: 8080
spring:
  profiles:
    active: ${active_profile}
```
## 2.2. 通过volumeMount方式使用
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: spring-k8s-test
spec:
  containers:
    - name: spring-test
      image: kimb88/hello-world-spring-boot
      ports:
        - containerPort: 8080
      volumeMounts:
        - name: application-prod  # 引用volume名称
          mountPath: /etc/config  # 挂载到容器内目录
  volumes:
    - name: application-prod
      configMap:
        name: spring-configfiles
        items:
          - key: application.yml  # 配置项key
            path: application.yml  # 配置项value的内容将生成到名称application.yml的文件中
```
> 如果不指定items，则使用volumeMount方式在容器内的目录为每个item都生成一个文件名为key的文件。

```
root@spring-k8s-test:/usr/local/tomcat# ls /etc/config
application.yml
root@spring-k8s-test:/usr/local/tomcat# cat /etc/config/application.yml
server:
  port: 8081
spring:
  profiles:
    active: prod
```
## 2.3. 限制
- configMap必须在pod之前创建，Pod才能引用
- 如果Pod使用envFrom基与configMap定义的环境变量，则无效的环境变量名称将被忽略，并在事件中被记录为InvalidVariableNames
- configMap受命名空间限制，只有处于相同命名空间中的Pod才可以引用它
- configMap无法用于静态Pod
