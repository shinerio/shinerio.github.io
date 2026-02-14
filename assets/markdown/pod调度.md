k8s Master上的Scheduler服务负责实现Pod调度，整个调度过程通过执行一系列复杂的算法，最终为每个Pod都计算出一个最佳的目标节点，这一过程是自动完成的，通过我们无法知道Pod最终会被调度到哪个节点上。
# 1. NodeSelector
可以实现将Pod调度到一些指定的Node上，可以通过Node的标签和Pod的nodeSelector属性匹配实现。
```shell
kubectl lable nodes <node-name> <label-key>=<label-value>
```
如果我们给多个Node都定义了相同的标签，则scheduler会根据调度算法从这组Noed中挑选一个可用的Node进行Pod调度。
# 2. Affinity
亲和型调度包括节点亲和性（NodeAffinity）和Pod亲和性（PodAffinity）两个维度。
- 可以使用软限制、优先采用等限制方式，代替之前的硬限制。这样调度器在无法满足优先需求的情况下，会退而求其次，继续运行改Pod
- 可以依据节点上正在运行的其他Pod的标签进行限制，而非节点本身的标签，这样就定义一种规则来描述Pod之间的亲和和互斥关系。
## 2.1. NodeAffinity
目前有两种节点亲和性表达
- RequiredDuringSchedulingIgnoredDuringException: 必须满足指定的规则才可以调度Pod到Node上，属于硬限制
- PreferredDuringSchedulingIgnoredDuringException: 强调优先满足指定规则，调度器会尝试调度Pod到Node上，但并不强求，相当于软限制。多个优先级规则还可以设置权重值，以定义执行的先后顺序。
> IgnoredDuringException意思是一个Pod所在Node节点在Pod运行期间标签发生了变更，不再符合该Pod的节点亲和性需求，则系统将忽略Node上Label的变化，该Pod能继续在节点上运行。

## 2.2. PodAffinity
简单地说，就是相关联的两种或多种Pod是否可以在同一个拓扑域中共存或者互斥，前者被称为Pod Affinity，后者被称为Pod Anti Affinity。