**OAuth 2.0**是一个关于授权（Authorization）的开放标准。它允许用户让第三方应用访问该用户在特定服务上存储的私有资源（如照片、联系人等），而无需将用户名和密码提供给第三方应用。最常见的例子就是：你使用“微信登录”或“GitHub登录”来注册一个新的网站，而不需要在该网站重新设置密码。
# 1. 四个核心角色
1. **资源所有者 (Resource Owner)**：即“用户”（你）。
2. **客户端 (Client)**：想要访问用户资源的“第三方应用”（例如某个新网站或App）。
3. **授权服务器 (Authorization Server)**：验证用户身份并颁发令牌的服务器（例如微信、Google、GitHub的认证系统）。
4. **资源服务器 (Resource Server)**：存放用户实际数据的服务器（例如微信的用户信息接口、你的云盘文件）。
# 2. 授权码模式通信过程
- **第一步：用户点击“登录”** 用户在第三方应用（Client）上点击“用 GitHub 登录”，应用将用户重定向到 GitHub 的授权页面。
- **第二步：用户同意授权**用户在 GitHub 的页面输入账号密码，确认授权该应用访问自己的基本信息。
- **第三步：返回授权码 (Authorization Code)** GitHub 验证通过后，将用户重定向回第三方应用，并在 URL 参数中带上一个临时的“授权码”。
- **第四步：换取令牌 (Access Token)** 第三方应用在**后台**（服务器对服务器）拿着这个授权码和自己的App Secret，向GitHub 的授权服务器请求正式的“访问令牌”。
- **第五步：访问资源** 第三方应用拿到令牌后，就可以拿着令牌去 GitHub 的资源服务器请求你的头像、昵称等数据了。
# 3. 使用过程
1. 通过在Authorization Server中注册Application，获取Application（Oauth2.0中的client）关联的client id和secret
2. 通过Oauth2.0获取Authorization Server上任意授权用户（Oauth2.0中的Resource owner）的access_token
3. 代替token去访问Resource Server
# 4. 安全性
## 4.1. 令牌（Token） vs 密码
- **密码是长期有效的**，一旦泄露，攻击者可以控制你的整个账号。
- **令牌是短期且有限的**。它可以被设置为“只能读取头像，有效期 2 小时”。即使令牌被盗，损失也受控，且用户可以随时在后台撤回某个应用的授权。
## 4.2. 授权码的必要性（安全性）
为什么要先发授权码，再换令牌？
- 因为第一步重定向是在浏览器中进行的，URL 记录、浏览器历史或插件都可能窃取到参数。
- 如果直接发送令牌（Token），安全性较低。
- **授权码模式**确保了令牌的传输发生在“第三方应用服务器”和“授权服务器”之间，不经过用户的浏览器，极大地降低了泄露风险。
## 4.3. client id&client secret
在 OAuth 2.0 的体系中，**Client ID**和 **Client Secret** 就像是**第三方应用**的“身份证号”和“密码”。它们成对出现，用于授权服务器识别并验证“到底是哪个应用在请求数据”。
### 4.3.1. 核心定义与类比

| **概念**            | **类比**         | **属性**             | **作用**                  |
| ----------------- | -------------- | ------------------ | ----------------------- |
| **Client ID**     | **用户名 / 身份证号** | 公开的 (Public)       | 标识应用的身份，告诉授权服务器“我是谁”。   |
| **Client Secret** | **登录密码 / 密钥**  | 私有的 (Confidential) | 证明应用的身份，告诉授权服务器“我真的是我”。 |

### 4.3.2. Client ID 的作用
Client ID 是一个公开的唯一标识符。当你创建一个 OAuth 应用（比如在 GitHub 开发者平台注册）时，系统会自动生成它。
- **标识身份**：当用户被重定向到授权页面时，URL中会包含 `client_id`。授权服务器通过它来向用户展示：“应用 **ABC** 想要申请访问您的权限”。
- **配置校验**：授权服务器会检查该 `client_id`对应的回调地址（**Redirect URI**）是否与请求中的地址匹配，防止钓鱼攻击。
### 4.3.3. Client Secret 的作用
Client Secret 是绝对不能公开的密钥，必须安全地保存在服务器后端。
- **身份认证**：在“授权码模式”的最后一步，第三方应用需要用“授权码 + Client Secret”去换取 Access Token。授权服务器会验证 Secret 是否正确。
- **防止冒充**：即便黑客在浏览器端截获了你的 `client_id` 和授权码（Code），但因为他们没有你的 `client_secret`，依然无法换取真正的访问令牌。
### 4.3.4. 通信过程
以“授权码模式”为例，看看这两个参数在什么时候出场：
1. 前端请求（公开）：
    应用跳转到 GitHub 登录页：github.com/auth?client_id=12345&redirect_uri=...
    此时只需要 Client ID，因为它是在浏览器地址栏公开显示的。
2. 后端交换（加密）：
    应用服务器拿到授权码后，在后台发送 POST 请求：
```
    HTTP
    POST /token
    Host: github.com
    Content-Type: application/x-www-form-urlencoded
    
    grant_type=authorization_code
    &code=AUTH_CODE_HERE
    &client_id=12345
    &client_secret=MY_CONFIDENTIAL_SECRET
```
> 此时必须带上 Client Secret。这是在服务器之间进行的，用户和黑客都看不到。
## 4.4. Homepage URL
在 GitHub 的 OAuth 2.0 配置中，**Homepage URL（主页 URL）** 的作用主要体现在以下几个方面：
### 4.4.1. 标识应用来源
它是你应用的**官方网站地址**。当用户被重定向到 GitHub 的授权页面时，GitHub 会向用户展示这个链接。
- **作用**：让用户知道是哪个网站在申请权限，增加信任感。用户可以点击这个链接跳转到你的主页，确认应用的真实性。
### 4.4.2. 安全校验与应用归属
虽然它不像 `Authorization callback URL`（回调地址）那样直接参与技术层面的 Token 交换校验，但它是应用定义的必要组成部分。
- **规范要求**：GitHub 要求每个 OAuth App 必须有一个主页，以符合其平台的合规性要求。
### 4.4.3. 用户管理权限
如果用户以后想要撤销对你应用的授权，他们会在 GitHub 个人设置的“Authorized OAuth Apps”列表中看到你的应用，点击应用名称通常会跳转到你设置的这个 **Homepage URL**。
# 5. apifox访问github示例
https://apifox.com/apiskills/how-to-use-github-oauth2/