# 1. TLS是什么
Transport Layer Security (TLS) 是一种被广泛采用的安全协议，旨在增强互联网通信的私密性和数据安全性。TLS的主要使用场景是对Web应用和服务器之间的通信（例如，Web 浏览器加载网站）进行加密。TLS 还可以用于加密其他通信，如电子邮件、消息传递和 [IP 语音 (VoIP)](https://www.cloudflare.com/learning/video/what-is-voip/) 等。在本文中，我们将重点介绍 TLS 在 [Web 应用安全](https://www.cloudflare.com/learning/security/what-is-web-application-security/)中发挥的作用。

TLS 由互联网工程任务组（Internet Engineering Task Force, IETF）提出，协议的第一个版本于1999年发布。最新版本是 [TLS 1.3](https://www.cloudflare.com/learning/ssl/why-use-tls-1.3/)，发布于 2018 年。
# 2. TLS与SSL
Netscape开发了名为安全套接字层（Secure Socket Layer，[SSL](https://www.cloudflare.com/learning/ssl/what-is-ssl/)）的上一代加密协议，TLS由此演变而来。TLS 1.0 版实际上最初作为SSL 3.1版开发，但在发布前更改了名称，以表明它不再与 Netscape 关联。由于这个历史原因，TLS 和 SSL 这两个术语有时会互换使用。
>[!note]
>SSL最终版本为SSL 3.0，从1996开始已经不更新了。SSL3.0存在很多已知安全风险，我们在应用不应该再使用了。同时，大多数浏览器也不再支持SSL3.0
# 3. TLS发展
TLS的最新版本是2018年发布的TLS1.3
- **更安全**：TLS1.3放弃了对较旧、安全性较低的加密功能的支持
- **更快**：加快了 [TLS 握手](https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/) ，TLS1.3中的TLS握手只需要一次往返（或来回通信）而不是两次，从而将过程缩短了几毫秒。如果客户端之前连接过网站，那么下次TLS握手的往返次数为零。这使HTTPS连接更快，减少[延迟](https://www.cloudflare.com/learning/performance/glossary/what-is-latency/)并改善整体用户体验
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory20250401221027.png)
# 4. TLS基本概念
TLS协议主要包括了三个部分：加密、认证和完整性保护
- **Encryption:** 隐藏从第三方传输的数据。
- **Authentication:** 确保参与信息交换的各方的身份都是真实的。
- **Integrity:** 验证数据未被伪造或篡改。
## 4.1. TLS证书
网站或应用要使用TLS，必须在其服务器上安装TLS证书（旧称SSL证书）。TLS 证书由证书**权威机构**颁发给拥有域的个人或企业。该证书包含有关**域所有者**的重要信息以及服务器的**公钥**，两者对验证服务器身份都很重要。
## 4.2. CipherSuites
在TLS（传输层安全协议）中，加密套件（Cipher Suite）是一组用于在客户端和服务器之间建立安全通信的**加密算法和协议的组合**。它定义了在TLS握手过程中使用的具体加密机制，以确保数据的保密性、完整性和身份验证。
#### 4.2.1.1. 组成部分
- **密钥交换算法**：负责在客户端和服务器之间安全地交换会话密钥。常见的密钥交换算法有RSA、Diffie - Hellman（DH）、椭圆曲线 Diffie - Hellman（ECDH）等。例如，RSA算法可以用于服务器向客户端发送其公钥，客户端使用该公钥加密一个预主密钥并发送给服务器，双方再基于这个预主密钥生成会话密钥。
- **身份验证算法**：用于验证通信双方的身份。通常依赖于数字证书和公钥基础设施（PKI）。常见的身份验证算法与密钥交换算法相关，如使用RSA算法进行服务器身份验证，客户端可以通过验证服务器证书中的公钥来确认服务器的身份。
- **对称加密算法**：用于在建立会话密钥后对实际传输的数据进行加密和解密。常见的对称加密算法有AES（高级加密标准）、3DES 等。以AES为例，它具有较高的加密强度和效率，能够快速地对大量数据进行加密和解密操作。
- **消息认证码（MAC）算法**：用于确保数据的完整性和真实性。在数据传输过程中，发送方会根据数据和会话密钥生成一个MAC值，并将其与数据一起发送。接收方在接收到数据后，使用相同的算法和会话密钥重新计算MAC值，并与接收到的MAC值进行比较。常见的MAC算法有 HMAC-SHA1、HMAC-SHA256 等。
#### 4.2.1.2. 命名规则
加密套件通常采用一种标准化的命名方式，即`TLS_密钥交换算法_身份认证算法_WITH_对称加密算法_消息摘要算法`。
一个典型的加密套件名称可能是 `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256`，其含义如下：
- `TLS`：表示该加密套件基于TLS协议。
- `ECDHE`：代表密钥交换算法为椭圆曲线 Diffie - Hellman（ECDH）的临时密钥交换模式（Ephemeral），提供前向保密性。
- `RSA`：表示身份验证算法使用RSA。
- `AES_128_GCM`：指对称加密算法为AES，密钥长度为128位，使用GCM（Galois/Counter Mode）模式，该模式结合了加密和认证功能。
- `SHA256`：表示消息认证码（MAC）算法使用SHA-256哈希函数。
比如`TLS_DHE_RSA_WITH_AES_256_CBC_SHA256`
- 密钥交换算法是`DHE`
- 身份认证算法是`RSA`
- 对称加密算法是AES_256_CBC
- 消息摘要算法是SHA256
由于RSA又可以用于加密也可以用于身份认证，因此密钥交换算法使用RSA时，只写一个RSA，比如`TLS_RSA_WITH_AES_256_CBC_SHA256`
#### 4.2.1.3. 套件的选择
在TLS握手过程中，客户端会向服务器发送一个**支持的加密套件列表**，服务器会从这个列表中**选择一个双方都支持的加密套件**，并在握手过程中通知客户端。选择加密套件时，通常会考虑以下因素：
- **安全性**：优先选择使用高强度加密算法和提供前向保密性的加密套件。
- **性能**：不同的加密算法在性能上可能存在差异，需要根据实际应用场景进行权衡。
- **兼容性**：确保客户端和服务器都支持所选的加密套件。
# 5. TLS的通信过程
完整TLS握手需要经过2-RTT
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202505142208829.png)

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory20250402222553.png)
# 6. TLS协议解析
TLS协议是一个分层协议，第一层为TLS记录层协议(Record Layer Protocol)，该协议用于封装各种高级协议。目前封装了4种协议：握手协议（Handshake Protocol）、改变密码标准协议（Change Cipher Spec Protocol）、应用程序数据协议（Application Data Protocol）和警报协议（Alert Protocol）。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory20250402221259.png)

抓包示例
![[https_example.pcapng]]

> [!note]
> `Change Cipher Spec Protocol`在TLS1.3被去除。
### 6.1.1. Record Layer Protocol
记录层(Record Layer Protocol)包含协议类型、版本号、长度、以及封装的高层协议内容。记录层头部为固定5字节大小。
![20200522091116.png](https://img2020.cnblogs.com/blog/580757/202005/580757-20200522091117417-275634995.png)

> [!note]
> 在TLS协议规定了，如接收到了未定义的协议协议类型，需要发送一个`unexpected_message`警报。
### 6.1.2. HandShake Protocol
握手用于确认认证双方身份并协商加密算法
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory20250402221528.png)
[TLSv1.2](https://datatracker.ietf.org/doc/html/rfc5246)握手过程如下：
```
  Client                                                       Server
 
  ClientHello                  -------->
                                                          ServerHello
                                                          Certificate*
                                                    ServerKeyExchange*
                                                  CertificateRequest*
                                <--------              ServerHelloDone
  Certificate*
  ClientKeyExchange
  CertificateVerify*
  [ChangeCipherSpec]
  Finished                     -------->
                                                    [ChangeCipherSpec]
                                <--------                     Finished
  Application Data             <------->             Application Data
```

`*`表示可选步骤或与实际握手情况相关。比如重建已有连接，服务端无需执行Certificate，再比如使用RSA公钥加密时，无需ServerKeyExchange。  
> [!note]
> 完整的握手流程有时候也被称为2-RTT流程，即完整的握手流程需要客户端和服务端交互2次才能完成握手。

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory20250402222553.png)
- 当客户端连接到支持TLS协议的服务端要求创建安全连接并列出了受支持的算法套件（包括加密算法、散列算法等），握手开始。
- 服务端从客户端的算法套件列表中指定自己支持的一个算法套件，并通知客户端
- 服务端发回其数字证书，此证书通常包含服务端的名称、受信任的证书颁发机构（CA）和服务端的公钥。
- 客户端确认其颁发的证书的有效性。
- 为了生成会话密钥用于安全连接，客户端和服务端分别基于椭圆曲线算法生成一对公私钥，并将公钥发送给对方。
- [[加密算法#3.2.1. ECDH协商简要过程|客户端和服务端分别基于自己的私钥和对端的公钥生成对称加密密钥]]

握手协议的结构如下，其中协议头的ContentType固定为`22`，接下来是TLS版本号，TLS1.2为`0303`，最后是用2字节表示长度。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202504022308372.png)
HandshakeType握手协议类型包含以下：
- hello_request：0
- client_hello：1
- server_hello：2
- certificate：3
- server_key_exchange ：12
- certificate_request：13
- server_hello_done：14
- certificate_verify：15
- client_key_exchange：16
- finished：20
> [!note]
> Hello Message是具体的握手协议类型内容，不同协议内容有所不同。
#### 6.1.2.1. client hello
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202504022316519.png)

当客户端首次与服务端建立连接或需要重新协商加密握手会话时，需要将`Client Hello`作为第一条消息发送给服务端。
`Client Hello`消息包含了许多重要信息，包括客户端版本号、客户端随机数、会话ID、密钥套件、压缩方式、扩展字段等。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202504022311071.png)
- 客户端版本号：客户端支持的最新TLS版本号，服务端会根据该协议号进行协议协商。
- 32位随机数：客户端生成的32位随机数。前4位是Unix时间戳，该时间戳为1970年1月1日0点以来的秒数。不过TLS并没有强制要求校验该时间戳，因此允许定义为其他值。后面28位为一个随机数。
> [!note] 
通过前4字节填写时间方式，有效的避免了周期性的出现一样的随机数。使得"随机"更加"随机"。  在TLS握手时，客户端和服务端需要协商数据传输时的加密密钥。为了保证加密密钥的安全性。密钥需要通过客户端和服务端一起生成。客户端和服务端都提供一个32位的随机数，通过该随机数使用基于HMAC的PRF算法生成客户端和服务端的密钥。
- 会话ID：用于表示客户端和服务端之间的会话。实际的会话ID是由服务端定义的，因此即使是新的连接，服务端返回的会话ID可能也会和客户端不一致，由于会话ID是明文传输的，因此不能存放机密信息。
    - 若会话ID是新的，则客户端和服务端需要建立完整的TLS握手连接流程。
    - 若会话ID是较早连接的会话ID，则服务端可以选择无需执行完整的握手协议。
- 算法套件：客户端将支持的加密算法组合排列后发送给服务端，从而和服务端协商加密算法。服务端根据支持算法在ServerHello返回一个最合适的算法组合。  
- 压缩方式：用于和服务端协商数据传输的压缩方式。由于TLS压缩存在安全漏洞，因此在TLS1.3中已经将TLS压缩功能去除，TLS1.2算法也建议不启用压缩功能。
- 扩展字段：可以在不改变底层协议的情况下，添加附加功能。客户端使用扩展请求其他功能，服务端若不提供这些功能，客户端可能会中止握手。对于扩展字段的详细定义可以看[Transport Layer Security (TLS) Extensions](https://tools.ietf.org/html/rfc4366)
> [!warning]
客户端发送完 `ClientHello` 消息后，将等待 `ServerHello` 消息。 服务端返回的任何握手消息（`HelloRequest` 除外）将被视为致命错误。
#### 6.1.2.2. server HEELO
当服务端接收到`ClientHello`，则开始TLS握手流程， 服务端需要根据客户端提供的加密套件，协商一个合适的算法簇，其中包括对称加密算法、身份验证算法、非对称加密算法以及消息摘要算法。若服务端不能找到一个合适的算法簇匹配项，则会响应握手失败的预警消息。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202504022321226.png)
- 版本号：服务端根据客户端发送的版本号返回一个服务端支持的最高版本号。若客户端不支持服务端选择的版本号，则客户端必须发送`protocol_version`警报消息并关闭连接。
> [!note]
> - 若服务端接收到的版本号小于当前支持的最高版本，且服务端希望与旧客户端协商，则返回不大于客户端版本的服务端最高版本。
> - 若服务端仅支持大于client_version的版本，则必须发送`protocol_version`警报消息并关闭连接。  
> - 若服务端收到的版本号大于服务端支持的最高版本的版本，则必须返回服务端所支持的最高版本。
- 32位随机数：服务端生成的32位随机数，生成方式和客户端一样。服务端生成随机数的可以有效的防范中间人攻击，主要是通过防止重新握手后的[重放攻击](https://security.stackexchange.com/questions/218491/why-using-the-premaster-secret-directly-would-be-vulnerable-to-replay-attack)。
- 会话ID：用于表示客户端和服务端之间的会话。若客户端提供了会话ID，则可以校验是否与历史会话匹配。
    - 若不匹配，则服务端可以选择直接使用客户端的会话ID或根据自定义规则生成一个新的会话ID，客户端需要保存服务端返回的会话ID当作本次会话的ID。
    - 若匹配，则可以直接执行1-RTT握手流程，返回ServerHello后直接返回`ChangeCipherSpec`和`Finished`消息。
- 算法套件：服务端根据客户端提供的算法套件列表和自己当前支持算法进行匹配，选择一个最合适的算法组合，若没有匹配项，则使用默认`TLS_RSA_WITH_AES_128_CBC_SHA`。
> [!note]
TLS1.2协议要求客户端和服务端都必须实现密码套件`TLS_RSA_WITH_AES_128_CBC_SHA`
- 压缩方式：用于和服务端协商数据传输的压缩方式。由于TLS压缩存在安全漏洞，因此在TLS1.3中已经将TLS压缩功能去除，TLS1.2算法也建议不启用压缩功能。
- 扩展字段：服务端需要支持接收具有扩展和没有扩展的ClientHello。服务端响应的扩展类型必须是`ClientHello`出现过才行，否则客户端必须响应`unsupported_extension`严重警告并中断握手。
> [!note]
[RFC 7568](https://tools.ietf.org/html/rfc7568)要求客户端和服务端握手时不能发送`{3,0}`版本，任何收到带有协议Hello消息的一方版本设置为`{3,0}`必须响应`protocol_version`警报消息并关闭连接。

通过`ClientHello`和`ServerHello`，客户端和服务端就协商好算法套件和用于生成密钥的随机数。

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202504022317581.png)
密钥交换算法：ECDHE 
身份认证算法：RSA
对称加密算法：AES_128_GCM
重要算法：SHA256
#### 6.1.2.3. certificate
假设客户端和服务端使用默认的`TLS_RSA_WITH_AES_128_CBC_SHA`算法，在`ServerHello`完成后，服务端必须将本地的RSA证书传给客户端，以便客户端和服务端之间可以进行非对称加密保证对称加密密钥的安全性。  
RSA的证书有2个作用：
- 客户端可以对服务端的证书进行合法性进行校验。
- 对`Client Key Exchange`生成的pre-master key进行公钥加密，保证只有服务端可以解密，确保对称加密密钥的安全性。
![20200526135243.png](https://img2020.cnblogs.com/blog/580757/202005/580757-20200526135246621-696721414.png)
发送给客户端的是一系列证书，服务端的证书必须排列在第一位，排在后面的证书可以认证前面的证书。  当客户端收到了服务端的`ServerHello`时，若客户端也有证书需要服务端验证，则通过该握手请求将客户端的证书发送给服务端，若客户端没有证书，则无需发送证书请求到服务端。
> 证书必须为[X.509v3格式](https://baike.baidu.com/item/X.509/2817050?fr=aladdin)。
#### 6.1.2.4. Server Key Exchange
使用RSA公钥加密，必须要保证服务端私钥的安全。若私钥泄漏，则使用公钥加密的对称密钥就不再安全。同时RSA是基于大数因式分解。密钥位数必须足够大才能避免密钥被暴力破解。
> [!warning]
> 1999年，RSA-155 (512 bits) 被成功分解。  
> 2009年12月12日，RSA-768 (768 bits)也被成功分解。  
> 在2013年的棱镜门事件中，某个CA机构迫于美国政府压力向其提交了CA的私钥，这就是十分危险的。

相比之下，使用DH算法通过双方在不共享密钥的情况下双方就可以协商出共享密钥，避免了密钥的直接传输。DH算法是基于离散对数，计算相对较慢。而基于椭圆曲线密码（ECC）的DH算法计算速度更快，而且用更小的Key就能达到RSA加密的安全级别。ECC密钥长度为224~225位几乎和RSA2048位具有相同的强度。
> ECDH:基于ECC的DH算法。

另外在DH算法下引入动态随机数，可以避免密钥直接传输。同时即使密钥泄漏，也无法解密其他消息，因为双方生成的动态随机数无法得知。
> 在密码学中该特性被称为[前向保密](https://zh.wikipedia.org/wiki/%E5%89%8D%E5%90%91%E4%BF%9D%E5%AF%86)
> DHE: 通过引入动态随机数，具有前向保密的DH算法。  
> ECDHE：通过引入动态随机数，具有前保密的ECDH算法。
#### 6.1.2.5. Certificate Request
当需要TLS双向认证的时候，若服务端需要验证客户端的证书，则向客户端发送`Certificate Request`请求获取客户端指定类型的证书。
- 服务端会指定客户端的证书类型。
- 客户端会确定是否有合适的证书。
#### 6.1.2.6. Server Hello Done
当服务端处理Hello请求结束时，发送`Server Hello Done`消息，然后等待接收客户端握手消息。客户端收到服务端该消息，有必要时需要对服务端的证书进行有效性校验。

![20200526161422.png](https://img2020.cnblogs.com/blog/580757/202005/580757-20200526161424308-2087692628.png)
#### 6.1.2.7. Client Certificate
当客户端收到了服务端的`CertificateRequest`请求时，需要发送`Client Certificate`消息，若客户端无法提供证书，则仍要发送此消息，消息内容可以不包含证书。

![20200526135243.png](https://img2020.cnblogs.com/blog/580757/202005/580757-20200526135246621-696721414.png)

#### 6.1.2.8. Client Key Exchange
客户端接收到ServerHelloDone消息后，计算密钥，通过发送`Client Key Exchange`消息给服务端。客户端和服务端通过`Key Exchange`消息交换密钥，使得双方的主密钥协商达成一致。

![20200526175211.png](https://img2020.cnblogs.com/blog/580757/202005/580757-20200526175212460-1534904649.png)

以RSA的密钥协商为例。在`ClientHello`和`ServerHello`分别在客户端和服务端创建了一个32位的随机数。客户端接收到`Server Hello Done`消息时，生成最后一个48位的预主密钥。通过服务端提供的证书进行公钥加密，以保证只有服务端的私钥才能解密。

> 其中预主密钥的前2位要求使用`Client Hello`传输的TLS版本号（存在一些TLS客户端传递的时协商后的TLS版本号，对该版本号检查时可能会造成握手失败）。

需要注意的是，若RSA证书的填空格式不正确，则可能会存在一个漏洞导致客户端发送的PreMasterSecret被中间人解密造成数据加密的对账密钥泄漏。可以看下[Attacking RSA-based Sessions in SSL/TLS](https://eprint.iacr.org/2003/052)
#### 6.1.2.9. Certificate Verify
若服务端要求客户端发送证书，且客户端发送了非0长度的证书，此时客户端想要证明自己拥有该证书，则需要使用客户端私钥签名一段数据发送给服务端继续验证。该数据为客户端收发的所有握手数据的hash值（不包括本次消息）。

![20200619203948.png](https://img2020.cnblogs.com/blog/580757/202006/580757-20200619203949761-1258998351.png)
#### 6.1.2.10. Finished
当发送完`Change Cipher Spec`消息后必须立即发送该消息。当该消息用于验证密钥交换和身份验证过程是否成功。

![20200526175339.png](https://img2020.cnblogs.com/blog/580757/202005/580757-20200526175340642-1806058204.png)

`Finished`消息是第一个使用协商的算法簇进行加密和防篡改保护的消息。一旦双方都通过了该消息验证，就完成了TLS握手。  
VerifyData为客户端收发的所有握手数据的hash值（不包括本次消息）。与`Certificate Verify`的hash值可能会不一样。如果发送过`Certificate Verify`消息，服务端的握手消息会包含`Certificate Verify`握手的数据。

> 需要注意的是，握手数据不包括协议头的握手协议明文数据（服务端返回`Finished`的验证握手数据是包含接收到客户端的`Finished`的明文hash值）。

> `Finished`消息数据加密和`Appilication Data`一致，具体数据加密在`Application Data`段进行说明。
### 6.1.3. Change Cipher Protocol
在此之前，双方通信基本是明文或处于密钥协商未完成状态，该消息发送后，后续消息切换为用选定的对称加密算法对后续数据加密后再传输，确保数据的机密性和完整性 。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202504022255474.png)
### 6.1.4. Alert Protocol
警报消息传达消息的严重性（警告或致命）和警报的说明。具有致命级别的警报消息会导致立即终止连接。  若在改变密码标准协议前接收到警报消息，是明文传输的，无需解密。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202504022336824.png)
与其他消息一样，警报消息按当前连接状态指定进行加密和压缩。在接收到改变密码标准协议后接收到警报协议，则需要进行解密。解密后即为警报协议明文格式。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202504022336612.png)
### 6.1.5. Application Data Protocol
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202504022256036.png)
当客户端和服务端`Finished`发送完毕并验证通过后，握手就结束了。后续所有数据都会使用握手协商的对称密钥进行数据加密。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202504022336114.png)
TLS协议实现了数据加密和MAC计算。一般来说有3种加密模式，分别为：
1. Mac-then-Encrypt：在明文上计算MAC，将其附加到数据，然后加密明和+MAC的完整数据。
2. 加密和MAC：在明文上计算MAC，加密明文，然后将MAC附加到密文的末尾
3. Encrypt-then-Mac：加密明文，然后在密文上计算MAC，并将其附加到密文。
TLS协议使用的是`Mac-then-Encrypt`。首先将加密的序号、ContentType、数据长度、数据进计算HMAC-SHA256摘要。然后将摘要拼接到数据后，通过PKCS7格式对摘要+MAC数据进行填充对其和加密块大小一致。最后对`明文+MAC+对其填充块`进行加密。

需要注意的是应用程序数据消息有最大长度限制`2^14 + 2048`，当超过长度后，数据需要分段传输。每一段都当作单独的数据段进行单独MAC地址并加密。
# 7. TLS1.3
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/tls1_3.png)
TLS 1.3 的握手不再支持静态的 RSA 密钥交换，这意味着必须使用带有前向安全的Diffie-Hellman进行全面握手。客户端发送Client Hello时，附带了DH算法的公共参数和公钥，服务器返回Server Hello时，附带了DH算法生成的服务器公钥，即一次传输就完成了密钥交换。

|**特性**|**TLS 1.2**|**TLS 1.3**|
|---|---|---|
|**密码套件数量**|数十种（包含不安全选项）|仅 5 种官方套件（均为安全选项）|
|**密钥交换**|支持 RSA、DHE、ECDHE 等多种方式|仅支持 ECDHE（强制前向安全性）|
|**对称加密**|支持 CBC、GCM 等模式|仅支持 AEAD 模式（如 GCM、Poly1305）|
|**协商 RTT**|至少 1 个 RTT（复杂场景需 2 个 RTT）|仅需 1 个 RTT|
|**降级攻击防护**|需要 `fallback SCSV`|无需（移除不安全套件）|
## 7.1. 0-RTT
TLS 1.3 的 0-RTT（零往返时间）特性允许客户端在首次与服务器建立连接后，后续连接时直接发送应用数据，无需等待TLS握手完成，从而消除了传统握手所需的至少 1 个 RTT 延迟。这一特性通过**会话恢复**和预共享密钥（PSK）机制实现。
### 7.1.1. 基本原理
0-RTT 的核心在于客户端和服务器之间**预先共享密钥材料**，使得客户端可以在新连接的第一个消息中就发送加密的应用数据。这依赖于两个关键技术：
- **PSK（预共享密钥）**：服务器在首次握手时生成并存储一个会话密钥，客户端也保存该密钥的副本。
- **Early Data（早期数据）**：客户端使用PSK加密应用数据，并在新连接的初始消息中直接发送。
### 7.1.2. 建立过程
**首次握手（建立 PSK）**
当客户端与服务器首次建立 TLS 1.3 连接时（使用 1-RTT 握手），服务器会生成一个**会话票证（Session Ticket）**，其中包含：
- **PSK（预共享密钥）**：用于后续会话的加密密钥。
- **Ticket 有效期**：通常较短（如几小时），以平衡安全性和可用性。
- **Ticket 标识**：用于服务器识别该会话票证。
服务器将此会话票证加密后发送给客户端，客户端将其存储在本地（如浏览器缓存）。
**后续握手（使用 0-RTT）**
当客户端再次连接同一服务器时，流程如下：
1. **客户端发送 ClientHello**：
    - 包含之前存储的会话票证（PSK 标识）。
    - 标记 `early_data` 扩展，表示将发送 0-RTT 数据。
    - 直接携带使用PSK加密的**应用数据**（如 HTTP 请求）。
2. **服务器验证PSK**：
    - 检查会话票证的有效性和未过期。
    - 使用对应的 PSK 解密 0-RTT 数据。
3. **服务器响应**：
    - 发送ServerHello消息，完成标准的TLS 1.3握手（1-RTT）。
    - 在此期间，服务器可以处理并响应0-RTT数据。
```
ClientHello {
    ...
    extensions: [
        ...
        pre_shared_key: {
            identities: [
                {
                    obfuscated_ticket_age: <age>,
                    ticket: <会话票证数据>,  # 包含 PSK 标识
                    ...
                }
            ],
            binders: <PSK 绑定值>,  # 证明客户端拥有对应 PSK
        },
        early_data: <是否发送 0-RTT 数据>,  # 与 PSK 关联
        ...
    ]
}

ServerHello {
    ...
    extensions: [
        ...
        pre_shared_key: {
            selected_identity: <客户端提供的票证索引>,  # 服务器选择的 PSK
        },
        early_data: <是否接受 0-RTT 数据>,  # 与 PSK 关联
        ...
    ]
}
```

### 7.1.3. 优缺点
#### 7.1.3.1. 优点
- **极致性能**：完全消除握手延迟，适用于对延迟敏感的应用（如实时通信、金融交易）。
- **简化流程**：无需等待密钥交换和认证，直接发送数据。
#### 7.1.3.2. 缺点
- **重放攻击风险**：由于0-RTT数据使用静态PSK加密，攻击者可能截获并重复发送相同的数据。例如，重复提交支付请求。
- **有限的前向安全性**：PSK基于之前的会话，若该会话密钥泄露，0-RTT数据可能被破解。
- **服务器限制**：服务器可能选择不接受 0-RTT 数据（如处理幂等性操作时）。
### 7.1.4. 安全防护机制
为降低风险，TLS1.3对 0-RTT 施加了以下限制：
- **幂等性要求**：建议0-RTT数据仅用于幂等操作（如读取请求），避免执行重复提交会产生副作用的操作（如支付）。
- **PSK 有效期**：会话票证的有效期较短，减少被滥用的时间窗口。
- **Early Data 指示**：服务器可以通过 `EarlyDataIndication` 扩展明确告知客户端哪些数据是通过 0-RTT 接收的，便于应用层处理。
### 7.1.5. PSk
PSK 通过先前的TLS会话（如首次 1-RTT 握手）生成并分发，客户端和服务器各自存储一份副本，用于后续会话恢复。
```
客户端 → 服务器：ClientHello
服务器 → 客户端：ServerHello, EncryptedExtensions, Certificate*, CertificateVerify*, Finished
客户端 → 服务器：Finished
服务器 → 客户端：NewSessionTicket  // 会话票证在此处发送
```

![](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202505142224574.png)
会话票证（`ticket` 字段）是一个加密的二进制数据，通常包含：
- **PSK（预共享密钥）**：用于后续会话恢复。
- **票证 ID**：服务器用于识别该票证的唯一标识。
- **绑定数据**：确保票证只能用于特定的服务器配置。
- **加密参数**：如密钥派生函数和加密算法。
# 8. MTLS
mtls(mutual tls)通过双向认证，可以保证连接的两端都有对应的私钥，以此来验证两端的身份合法性。mtls通常被用于zero trust安全框架，以验证组织内的用户、设备和服务器。[[mtls实现]]中提供了java版本的客户端和服务端实现。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory20250606220928.png)
在mTLS中，客户端和服务器都有一个证书，并且双方都使用它们的公钥/私钥对进行身份验证。与常规TLS相比，mTLS中需要**服务端验证客户端证书**。
> [!note]
> 使用身份证书相对于appcode来说，更为安全，避免了appcode在网络中传输、泄露的风险。
- **中间人攻击**：中间人攻击者把自己放在客户端和服务器之间，拦截或修改两者之间的通信。当使用mTLS时，在途攻击者不能对客户端或服务器进行身份验证，使这种攻击几乎不可能进行。
- **欺骗攻击**：攻击者可以试图在用户面前“伪装”（模仿）Web 服务器，或在 Web 服务器面前伪装用户。当双方都必须用 TLS 证书进行身份验证时，欺骗攻击就会困难得多。
- 暴力攻击：暴力攻击执行，是指攻击者使用快速试错法来猜测用户的密码。mTLS确保一个密码不足以获得对组织网络的访问权。
- **网络钓鱼攻击**：
- 目的通常是为了窃取用户的凭据，然后利用这些凭据入侵网络或应用。即使用户上当受骗，攻击者仍然需要TLS证书和相应的私钥才能使用这些凭据。
- 恶意 API 请求：当用于API安全时，mTLS可确保API请求只来自合法的、经过身份验证的用户。这可以阻止攻击者发送恶意的API请求来利用漏洞或破坏API的预期运作方式。
> [!note] 与token、session/cookie等关系
mtls可以更安全地实现身份认证，但无法提供token、session/cookie等提供的权限控制能力。比如token中可以通过携带服务端签名的角色、权限等信息。
# 9. SNI（Server Name Indication）
Web服务器或负载均衡器承载多个域名，仅IP地址不足以指示用户尝试访问哪个域。这可能会导致服务器显示错误的SSL 证书，从而阻止或终止 HTTPS 连接。
> [!note]
> 当多个网站托管在一台服务器上并共享一个IP地址，并且每个网站都有自己的SSL证书，在客户端设备尝试安全地连接到其中一个网站时，服务器可能不知道显示哪个 SSL 证书。这是因为SSL/TLS 握手发生在客户端设备通过HTTP 连接到某个网站**之前**(http host header)。

SNI是TLS协议的扩展，以确保客户端设备能够看到他们尝试访问的网站的正确SSL证书。该扩展使得可以在TLS握手期间指定网站的主机名或域名 ，而不是在握手之后打开HTTP连接时指定。

简而言之，即使网站`https://www.example.com`托管在与`https://www.something.com`、`https://www.another-website.com`和`https://www.example.io`相同的地方（相同的IP地址），SNI也能让用户的设备与`https://www.example.com`建立安全的连接。

SNI在2003年被添加为TLS/SSL的扩展；它最初不是协议的一部分。几乎所有的浏览器、操作系统和Web服务器都支持它，除了一些仍在使用的最旧的浏览器和操作系统。
# 10. ref
https://segmentfault.com/a/1190000021494676
https://segmentfault.com/a/1190000021559557
[TLS1.2协议设计原理](https://www.cnblogs.com/Jack-Blog/p/13170728.html)
https://developer.aliyun.com/article/1245100