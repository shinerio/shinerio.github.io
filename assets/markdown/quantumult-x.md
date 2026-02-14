# 1. 参考配置
https://raw.githubusercontent.com/limbopro/Profiles4limbo/main/full.conf

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202503032252169.png)

# 2. 规则仓库
https://github.com/blackmatrix7/ios_rule_script/tree/master

# 3. 图标仓库
https://github.com/xiaotuolaji/QuanX-icon
https://github.com/Koolson/Qure

# 4. server配置
```
shadowsocks=test.com:36608, method=aes-128-gcm, password=yourpassword, obfs=http, obfs-host=xxxxx.baidu.com, fast-open=true, udp-relay=true, tag=🇺🇸美国-IEPL-GPT
```
# 5. 策略组
策略组是用于作为filter的目标的，即一个ip或域名命中某个规则后，下一跳应该送到哪个节点或哪个策略组。
> [!note]
> policy可以理解为一种特殊的代理节点，最终还是需要配置filter，将流量指向policy

QuantumultX总共提供5种类型策略组
- static静态策略组，可以嵌套其它所有类型的策略组，**`需自己手动选择路线/子策略组`**；
- Available 健康检查策略组，只可直接套用节点，不可嵌套其它策略组，自动选择**`第一个可用的节点`(需要至少`两个`节点)**；
- Round-Robin轮询策略，只能直接套用节点，不可以嵌套其它策略组，按网络请求**`轮流使用所有节点`**；
- dest-hash: Dest-Hash 策略用于随机负载均衡，相同域名走固定节点，此策略对于需要会话持久性的用例特别有用。
- url-latency-benchmark: URL-Latency-Benchmark 策略用于自动测试选出延迟最低的代理服务器。
	- ssid:  可以根据网络环境选择合适的代理服务组
## 5.1. 例子一
指定国家或地区的节点中自动延迟选择、故障转移、负载均衡
```
url-latency-benchmark=香港(延迟优选), server-tag-regex=^(?=.*(🇭🇰|香港|虚通|(?i)HK|Hong))(?!.*(回国|校园|游戏|教育|(?i)GAME|IPV6)).*$, check-interval=600, tolerance=0, alive-checking=false, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hong_Kong.png
round-robin=香港(负载均衡), server-tag-regex=^(?=.*(🇭🇰|香港|虚通|(?i)HK|Hong))(?!.*(回国|校园|游戏|教育|(?i)GAME|IPV6)).*$, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hong_Kong.png
url-latency-benchmark=台湾(延迟优选), server-tag-regex=^(?=.*(🇹🇼|台|(?i)TW|Tai))(?!.*(回国|校园|游戏|教育|久虚|(?i)GAME|IPV6)).*$, check-interval=600, tolerance=0, alive-checking=false, img-url=https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Rounded_Rectangle/Taiwan.png
round-robin=台湾(负载均衡), server-tag-regex=^(?=.*(🇹🇼|台|(?i)TW|Tai))(?!.*(回国|校园|游戏|教育|久虚|(?i)GAME|IPV6)).*$, img-url=https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Rounded_Rectangle/Taiwan.png
url-latency-benchmark=日本(延迟优选), server-tag-regex=^(?=.*((?i) 🇯🇵|日|川日|东京|大阪|泉日|埼玉|JP|Japan))(?!.*((?i)回国|校园|游戏|教育|久虚|GAME|IPV6)).*$, check-interval=600, tolerance=0, alive-checking=false, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png
```
## 5.2. 例子三
所有节点中自动延迟选择、故障转移、负载均衡
```
; 匹配所有节点节点tag，检测实验
url-latency-benchmark=自动(延迟优选), server-tag-regex=^*$, check-interval=600, tolerance=0, alive-checking=false, img-url=https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Universal/Auto_Speed.png
available=自动(故障转移), server-tag-regex=^*$, img-url=https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Universal/Available.png
round-robin=自动(负载均衡), server-tag-regex=^*$, img-url=https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Universal/RoundRobin.png
dest-hash=负载均衡(随机), server-tag-regex=^*$, img-url=https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Universal/RoundRobin.png
```
## 5.3. 例子三
上面的vailable，round-robin等都是原子policy，可以用static进行组合，这样我们可以在不更改filter目的policy的情况下（固定指向static policy），实现手动选择目的转发方式的效果。

例如：youtube和openapi规则都被分别强制使用了YouTube和OpenAI的policy
```
[filter_remote]
https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/YouTube/YouTube.list, tag=Youtube, force-policy=YouTube, update-interval=604800, opt-parser=false, enabled=true
https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/OpenAI/OpenAI.list, tag=OpenAI, force-policy=OpenAI, update-interval=172800, opt-parser=false, enabled=true
```
通过如下静态配置，我们就可以支持给YouTube和OpenAI选择不同的下一跳节点
```
static=OpenAI, 节点选择, proxy, 自动(延迟优选), 自动(故障转移), 自动(负载均衡), 负载均衡(随机), 香港(延迟优选), 香港(负载均衡), 台湾(延迟优选), 台湾(负载均衡), 日本(延迟优选), 日本(负载均衡), 韩国(延迟优选), 韩国(负载均衡), 新加坡(延迟优选), 新加坡(负载均衡), 美国(延迟优选), 美国(负载均衡), 英国(延迟优选), 英国(负载均衡), 土耳其(延迟优选), 土耳其(负载均衡), 全球直连, img-url=https://raw.githubusercontent.com/mgxray/Quantumult_x_II/main/country/chatgpt.png

static=YouTube, 节点选择, proxy, 自动(延迟优选), 自动(故障转移), 自动(负载均衡), 负载均衡(随机), 香港(延迟优选), 香港(负载均衡), 台湾(延迟优选), 台湾(负载均衡), 日本(延迟优选), 日本(负载均衡), 韩国(延迟优选), 韩国(负载均衡), 新加坡(延迟优选), 新加坡(负载均衡), 美国(延迟优选), 美国(负载均衡), 英国(延迟优选), 英国(负载均衡), 土耳其(延迟优选), 土耳其(负载均衡), 全球直连, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/YouTube.png
```

# 6. ref

**推荐学习基地**  
TG群组：[QuanXApp](https://t.me/QuanX_API)  
TG频道：[QuanXNews](https://t.me/QuanX_API)  
超详细教程：[Quantumult X 不完全教程](https://www.notion.so/Quantumult-X-1d32ddc6e61c4892ad2ec5ea47f00917)  

**软件介绍**  
Quantumult X 是Quantumult 作者推出的一款网络dl工具。目前仅IOS端可用。

**主要功能**  
翻墙，支持策略分流  
屏蔽广告（油管等）、解锁会员（网易云音乐等）  
运行js脚本（京东签到等）

# 基本配置
圈x的配置，其实就是由不同的配置片段组成，它有一个核心的“**配置文件**”。

配置方式：**1、软件ui交互**；**2、直接编辑“配置文件”**  
简单的软件设置通过“方式1”更方便，但有的通过“方式2”更快捷。  
经常听说的“懒人包”，其实就是直接给了你们编辑好的核心“配置文件”。

### 软件设置

#### 初始化设置：粗略熟悉一下基本设置

初次打开软件，请允许添加VPN配置

右下角**大风车**?分别有**节点、分流、重写、MitM、工具&分析、配置文件、其他设置**?拉到最后选择“**其他设置**”

*   模式：暂时先默认  
    资源：建议启用ICloud，换设备也能用。  
    通知：建议暂时都打开，熟悉后再按需选择  
    VPN：暂时先默认  
    其他：暂时不管

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-191.png)

**添加“资源解析器”**：其作用就是将你导入订阅、规则、重写等资源解析并转换成圈x所支持的格式。为了避免后面引用资源出错，请先进行这项配置。

**步骤：** 右下角**大风车**?拉到最后“配置文件-编辑”?右上角“小回车”?选择`[general]`?添加下面⬇️的连接?右上角“保存”

```
resource_parser_url=https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/resource-parser.js
```

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-192.png)

### 节点设置

目前圈x支持5种类型节点：SS， SSR， VMess， HTTP(s)，Trojan（不支持VLESS，?）

UI界面给了**4种**方式添加节点：

*   单次只能添加**1个**节点：添加后，信息出现在配置文件的 `[server_local]`模块 
    *   **添加**：仅支持SS
    *   **SS URI、扫码**：支持SS、SSR，或圈x格式的trojan/vmess/http
*   单次添加**多个**节点：订阅后，信息出现在配置文件的 `[server_remote]`模块
    *   **引用（订阅）**：以此为?

**步骤：** 右下角**大风车**?选择“节点-引用”?输入节点信息?打开资源解析器?右上角“保存”

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-194.png)

这里要用到“资源解析器”：不打开提示无法添加（如左图），打开则成功添加（如右图）。  
现在你应该get到了“资源解析器”的作用了。

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-195.png)

### 分流规则、策略组

根据我自己理解说的大白话，可能不够严谨，大佬们求放过。小白们，希望你们能懂我的意思。写教程也很考验语文啊。

*   **分流规则：** 配置文件中的`[filter_local]`(本地添加)/ ``[`filter_remote`]``(远程订阅)
    
    *   简单来说，就是把你访问的网址，按照你建立的分流规则来进行分流。
    
    *   存在优先级，越靠前越优先，不要随便打乱顺序。  
        其实也很好理解，你访问的网站被分流，最终到策略(组)处理。分流规则可能是包含与被包含关系。最先被匹配到的分流规则，按其对应节点或策略（组）被处理。
    *   例如：**全球分流规则**对应策略是**直连**，**油管分流规则**对应策略是**拒绝**，**油管分流**被**全球分流**包含。
        *   **全球分流规则**在前面，你访问油管先匹配“全球分流规则”，对应被处理就是“**直连**”
        *   **油管分流规则**在前面，你访问油管先匹配“油管分流规则”，对应被处理就是“**拒绝**”
        *   你们打不打麻将，大概意思就是被“截胡了”。
*   **策略组**：配置文件中的`[proxy]`模块
    *   服务于“分流规则”，你访问的网址被“分流规则”分流后，又由“策略组”来分发处理，可能是分配给“子策略(组)”，也可能给节点。简单来说，就是让你访问的网站自动走你设置好的节点或策略(组)。
*   **整体流程**：访问的网站匹配分流规则A?不同的节点或者是“直连”等策略(组)?最终被处理（处理效果取决于你的策略(组)或节点）

#### 分流规则

*   添加：配置文件中的`[filter_local]模块`
    *   一条一条添加，不推荐，耗时麻烦。
*   引用（订阅）：配置文件中 `[filter_remote]`模块
    *   推荐，可以“远程订阅”大佬已经写好的。引用的就是一个list文件，引用时要用raw链接。

以“神机规则”为?，通过“rule-list引用”方式，进行远程订阅。  
建议跟着添加一下，知道是什么意思就行，后面直接上懒人包。

神机规则地址：[https://github.com/DivineEngine/Profiles/tree/master/Quantumult/Filter](https://github.com/DivineEngine/Profiles/tree/master/Quantumult/Filter)

##### 1、随便找一个list?左上角Raw?复制浏览器地址，比如China.list

注意在上面的优先生效，就是更细分的先生效吧，精准定位的意思。

##### 2、选择”分流-引用“?标签“Chinalist”（可自定义）?”资源路径“，粘贴raw链接?右上角”保存“

[https://raw.githubusercontent.com/DivineEngine/Profiles/master/Quantumult/Filter/China.list](https://raw.githubusercontent.com/DivineEngine/Profiles/master/Quantumult/Filter/China.list)

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-196.png)

**策略组**

添加策略组3种方式

*   通过配置文件`[policy]`模块添加
    *   支持添加**所有**类型策略组
*   通过节点订阅列表添加
    *   支持添加策略组类型：**`static静态策略，available健康检查策略，round-robin负载均衡策略`**
*   通过订阅的`as-policy`参数生成并绑定策略组
    *   支持添加策略组类型：**`static静态策略，available健康检查策略，round-robin负载均衡策略`**

简单了解一下就行，等下最后直接小白配置导入。先上手再说，真正使用你就懂了，实践出真理。

### 重写与MitM

如果你跟着小姐姐一起玩了elecv2p，对这个应该就不陌生了。可以实现一些**去广告**、**跑脚本**等功能。

以**NobyDa大佬**的签到为?（野比大佬是真大佬，几乎哪里都是以他为例）

项目地址：[https://github.com/NobyDa/Script/tree/master/QuantumultX](https://github.com/NobyDa/Script/tree/master/QuantumultX)

#### 重写：对应配置文件中的`[rewrite_remote]` 以及 `[rewrite_local]` 模块

用于修改HTTP或HTTPS请求与响应（字面意思）

*   添加：手动单条添加，对应`[rewrite_local]`
*   引用：远程引用大佬地址，一般是.conf为后缀的文件格式，注意引用时要用raw链接。对应`[rewrite_remote]`

**步骤：** 选择“重写-引用”?粘贴复制的raw链接?打开“重写”

*   [https://raw.githubusercontent.com/NobyDa/Script/master/QuantumultX/Js.conf](https://raw.githubusercontent.com/NobyDa/Script/master/QuantumultX/Js.conf) #签到订阅
*   [https://raw.githubusercontent.com/NobyDa/Script/master/QuantumultX/Js\_Remote\_Cookie.conf](https://raw.githubusercontent.com/NobyDa/Script/master/QuantumultX/Js_Remote_Cookie.conf) #cookie获取订阅

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-198.png)

**查看脚本**：添加脚本订阅后，你可以查看脚本说明。以野比大佬的京东签到为?

**步骤**：选择“‘重写-浏览”?搜索“JD\_DailyBonus.js“?点击最右边的按钮?

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-199.png)

#### **MitM**：对应配置文件中的`[mitm]`模块

用于HTTPS解析，只有配置了主机名的请求才会被解析。（字面意思）

一般添加“重写”引用的时候，自动添加了主机名。

**步骤：** 选择“MitM”-“生成证书”?“配置证书”?“信任证书”?打开“MitM”

##### 1、生成并配置证书

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-201.png)

##### 2、安装证书

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-202.png)

##### 3、信任证书：设置?通用?关于本机?证书信任设置

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-204.png)

### **工具&分析**

暂时只说“**构造HTTP请求**”功能，跑脚本用，刚需。

*   手动添加：一次一个
*   任务仓库：一次多个，推荐
    *   支持订阅任务仓库了，非常方便，可以一次性添加任务仓库，按需选择添加定时任务。

#### 手动添加

**步骤：** 左上角“➕”?选择“高级”?“标签”(自定义)-Cron表达式(按需定时)-添加脚本路径-添加图标([查看脚本](#%E6%9F%A5%E7%9C%8B%E8%84%9A%E6%9C%AC)可获得)

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-206.png)

**Cron表达式**：还不懂的，看下面好好学习一下，花15分钟就差不多了。

![](https://www.kejiwanjia.net/wp-content/uploads/thumb/2021/04/fill_w120_h120_g0_mark_1.jpg)

 [![](https://www.kejiwanjia.net/wp-content/uploads/thumb/2021/04/fill_w120_h120_g0_mark_1.jpg)](https://www.kejiwanjia.net/jiaocheng/zheteng/notes/1958.html) 

#### 订阅任务仓库：以野比大佬的任务仓库为?

**步骤：** 上方“小盒子”?输入任务仓库raw链接?点击想添加的任务“➕”

[https://raw.githubusercontent.com/NobyDa/Script/8f882c9634896702011da3bfe1923fb2db627f8a/NobyDa\_BoxJs.json](https://raw.githubusercontent.com/NobyDa/Script/8f882c9634896702011da3bfe1923fb2db627f8a/NobyDa_BoxJs.json)

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-207.png)

#### 实操练习：以野比大佬的京东签到为?

确认重写、MitM、圈x总开关都打开了。

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-208.png)

##### 1、**获取京东Cookie：** 根据脚本说明，复制下面⬇️其中一个网址到safari，登录你的JD。

*   [https://home.m.jd.com/myJd/newhome.action](https://home.m.jd.com/myJd/newhome.action)：点击“我的”
*   [https://bean.m.jd.com/bean/signIndex.action](https://bean.m.jd.com/bean/signIndex.action)：点击“签到”并出现签到日历

如果成功，会收到“cookie获取成功”的通知。如果没有弹出通知，可以去“首页-日志”里面查看一下。

因为我之前获取过了，所以日志提示已经写入。

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-212.png)

##### 2、**运行“京东多合一签到”：** “工具&分析”?“**构造HTTP请求**“?右滑“京东多合一签到”?选择“▶️”运行

脚本需要跑一会儿，成功后会发送通知。或者选择左边第二个“≡”，实时查看运行状态。

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-211.png)

### 软件交互

#### 1、底部大风车

*   **短按：** 进入设置
*   **长按：** 切换dl模式（全部dl、直连、规则分流）  
    ![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-226.png)
    

*   **快速轻滑：** 唤出底部菜单（编辑配置文件、脚本记录、请求列表）  
    ![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-227.png)
    

#### 2、顶部工具条

*   **“节点“方块轻按右滑：** 切换工具块UI  
    ![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-225.png)
    

*   **短按：** 查看相关资源明细
*   **长按：** 显示资源列表、日志文件等

#### 3、**其他：** 点一点，滑一滑，都是基本操作。

小白配置
----

小白配置会覆盖你之前配置哦。

新知识学完了，下面来一个小白配置，感受一下大佬们的威武霸气。

开头说了，圈x有一个核心的“配置文件”，就像人的大脑?一样支配着软件运行。  
有大佬自己整理好了相对完整的配置文件，并分享出来给大家使用。  
我这里以“orz”大佬为?来介绍。  
大佬集成了分流、策略、去广告、比价、boxjs等功能，并给了非常详细的任务订阅列表，非常方便。  
项目地址：[https://github.com/Orz-3/QuantumultX](https://github.com/Orz-3/QuantumultX)  
TG频道：[https://t.me/Orzmini](https://t.me/Orzmini)  
TG群组：[https://t.me/Orz\_mini](https://t.me/Orz_mini)

> Quantumult X小白配置说明：  
> 本配置由神机规则修改而来，修改了默认策略组，增加了正则筛选策略组，并集成了多个作者的脚本及重写。  
> 附带按task脚本作者分类的task订阅，可按需求订阅。
> 
> 引用大佬原话

### 食用方法：就是把远程配置文件下到本地覆盖再进行设置。

#### 1、找到库里的**Orz-3.conf**文件，生成raw链接，复制地址

#### 2、回到圈x?右下角大风车?配置文件-下载?粘贴raw链接并保存。

这时候你会发现你之前添加的节点都已经被覆盖了，没有了。正常现象，不要惊慌。核心文件都换了，能不被覆盖么？

#### 3、重新打开重写和MitM：生成证书?配置证书?安装证书?信任证书

如果你之前已经配置过证书，也需要重新配置，否则打开圈x服务时，会提示错误。记得把之前的证书顺便删除。

#### 4、添加节点：右下角**大风车**?选择“节点-引用”?输入节点信息?打开资源解析器?右上角“保存”

### 真香体验报告

#### 1、分流及策略组：选择“规则分流”模式，爽歪歪。

长按右下角“大风车”?选择“白色大风车”（规则分流）

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-219.png)

*   参考作者的注意事项，梳理说明如下：  
    **5个正则策略组**：添加节点时，自动将香港，台湾，新加坡，美国，日本地区节点筛选出来  
    **5个嵌套策略组**：根据上面5个策略组进行了嵌套，方便切换选择  
    全球加速→国外网站  
    苹果服务→Appstore，Testflight  
    港台番剧→哔哩哔哩，爱奇艺  
    国际媒体→YouTube、Netflix、Amazon Prime Video  
    这类覆盖地区广泛或没有进行区域限制的流媒体服务  
    黑白名单→Final，即规则没有涉及到的  
    **其他说明：**   
    限定区域的流媒体服务已经指向对应区域策略（UK和KR除外）  
    TikTok默认指定全球加速  
    国内网站默认指定Direct（直连?）  
    去广告默认指定Reject（拒绝❌）

#### 2、重写：勾选☑️去广告，和比价是真的香，Cookie是跑脚本获取cookie用的，按需勾选。

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-220.png)

*   油管去广告：打开很流畅，卡顿不明显。  
    京东比价：打开商品页稍有那么一点点延迟，可接受范围内。  
    淘宝比价：需要点击”保障“页面显示。如果没有显示，尝试卸载重装就好了。  
    Cookie：就是跑脚本用的，可以在需要的时候再打开，不知道会不会和比价冲突，懒得试了。  
    Tiktok解锁：这个我是用不上，直接看作者说明：默认解锁日区，如需改区，本地在\[rewrite\_local\]下方添加(?<=\_region=)CN(?=&) url 307 JP 将JP更改成你想改的区域。  
    其他：你们自己去体验吧

#### 3、添加Task任务：工具&分析?构造HTTP请求?添加请求列表?上面的左一“小盒子图标”

作者详细整理了各位大佬们的任务仓库，简直不能更贴心了，小姐姐我佩服。当然你去找作者原生库地址，也一样的。

“orz”大佬把原库地址都放在了描述里，真的感动哭了。?具体列表去大佬库里自己看吧。

Task库地址：[https://github.com/Orz-3/QuantumultX/tree/master/Task](https://github.com/Orz-3/QuantumultX/tree/master/Task)

库里找到你想要添加的脚本json文件?生成raw链接?复制到请求列表任务仓库?添加你想要执行的任务

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-221.png)

#### 4、Boxjs：配置文件也集成了，完全就是一条龙服务。

Boxjs的多账号管理，确实还挺舒服的。访问地址：[http://boxjs.com:9999/](http://boxjs.com:9999/)

工具&分析?HTTP Backend?确认勾选☑️?浏览器访问[http://boxjs.com:9999/](http://boxjs.com:9999/)

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-223.png)

如果你跟我一样使用了Scriptable，请记得将网页小组件商店域名进行更改为[boxjs.com:9999](http://boxjs.com:9999/)，否则无法访问。

![](https://www.kejiwanjia.net/wp-content/uploads/2021/09/image-224.png)

**恭喜你，又成功掌握一项新技能！**

**后话：** 终于写完了，本来真的只是想简单说说，结果越写越多，怪我知道的太多了！！！  
希望小白能读的懂吧。如果通篇读透了，应该也就略知一二了。  
反正不管你们能不能懂，我写完之后，我又更懂了。?

\-> 加入科技玩家交流群组：[点击加入](https://www.kejiwanjia.net/announcement/5437.html) 注意:  
1.文中二维码和链接可能带有邀请性质，请各位玩家自行抉择。  
2.请勿通过链接填写qq号与密码、银行卡号与密码等个人隐私信息。  
3.禁止纯拉人头，拉app注册等信息，发现必小黑屋。  
4.同一种信息仅发一次，多发会被删除。  
5.文章中源码或APP等，无法保证其绝对安全，需自行辨别。  
6.文章关联方不想展示也可以微信站长“socutesheep”删除。


# ref
https://www.kejiwanjia.net/jiaocheng/zheteng/notes/21016.html
https://mgxray.xyz/355/
https://www.kejiwanjia.net/jiaocheng/zheteng/notes/21016.html