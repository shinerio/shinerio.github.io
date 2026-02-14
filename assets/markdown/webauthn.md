在数字时代，**密码**已成为我们日常生活和在线活动中不可或缺的一部分。尽管互联网已经发展了20多年，许多方面都有了巨大的改进，但只有密码，还是20年前的用法。更准确的说，它的用户体验比 20 年前更差了。
1. 密码的强度现在要求越来越高，一般不能少于8个字符，还要包括特殊符号。
2. 除了密码，通常还有其他验证（短信、图片识别、OTP 一次性密码等等）。
3. 为了避免被一锅端，我们还要为不同网站设置不同密码，在互联网如此发达的今天，要记住如此多的密码，属实有点困难

然而，即使变得如此麻烦，**依然不能杜绝密码被盗、被破解、被钓鱼的风险**。为了解决这些问题，WebAuthn应运而生。
# 1. WebAuthn简介
WebAuthn，全称Web Authentication，是由FIDO 联盟（Fast IDentity Online Alliance）和 W3C（World Wide Web Consortium）联合制定的一套新的**身份认证标准**，旨在为网络身份验证提供一种更强大、更安全的方式，**使用户能够使用他们的设备（如手机、USB 密钥或生物识别器）来进行身份验证，而无需使用密码**。该标准于2019 年3月4日正式成为 W3C 的推荐标准。目前主流的浏览器已经支持 WebAuthn，包括 Chrome、Firefox、Edge 和 Safari，更详细的支持情况可以通过[https://webauthn.me/browser-support](https://webauthn.me/browser-support) 查看。

> 注：FIDO联盟是一个非营利性组织，由Google、微软、苹果、三星、高通、芯片厂商、支付公司、银行、电信运营商、认证公司等组成，旨在为用户提供更安全、更简单的身份验证体验。_

# 2. WebAuthn的工作原理
WebAuthn的原理并不复杂，它的核心是基于非对称的加密技术。在WebAuthn中，用户的身份认证是通过**公钥和私钥来实现的**。这很像我们平常使用配置了公私钥的SSH登录服务器的过程，只不过WebAuthn 是在浏览器中实现的。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202508091603500.png)

# 3. WebAuthn的组成部分
WebAuthn由以下三个组成部分组成：
1. **用户代理（User Agent）**：用户代理是指浏览器或者其他支持WebAuthn的客户端，它负责与用户进行交互，收集用户的身份认证信息，并将其发送给服务器。
2. **身份验证器（Authenticator）**：身份验证器是指用于生成公钥和私钥的设备，如手机、USB密钥或生物识别器。Windows Hello和macOS的Touch ID也都是常见的身份验证器。
3. **Relying Party**：Relying Party 是指需要进行身份认证的网站或应用程序，它负责生成挑战（Challenge）并将其发送给用户代理，然后验证用户代理发送的签名结果。  

上述三者在两个不同的用例（注册和认证）中协同工作，如下图所示。图中的各个实体之间的所有通信都由用户代理（通常是Web浏览器）处理。

# 4. WebAuthn API
涉及到两个主要的 API:
- `navigator.credentials.create()`：用于在**注册**阶段生成公钥和私钥
- `navigator.credentials.get()`：用于在**认证**阶段对服务端的挑战（Challenge）进行签名
