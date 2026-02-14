在密码学和数字证书体系中，一般没有“私钥证书”的说法。主要是公钥证书。公钥证书（通常就简称为数字证书）是一种电子文档，包含以下信息
- 公钥信息
- 持有者身份信息（如姓名、组织等）
- 证书颁发机构（CA）的数字签名等
其主要目的是将**公钥与特定的实体（如个人、服务器等）绑定**，用于在网络通信等场景中验证对方身份，确保信息是发送给正确的接收方，并且保证信息传输的保密性、完整性和不可否认性。例如，在网站的SSL/TLS加密通信中，浏览器会验证网站的公钥证书来确保安全连接。
# 1. 证书域名绑定
证书分为范域名证书和单域名证书。
## 1.1. 泛域名证书
泛域名证书可以保护一个主域名以及该主域名下的所有[子域名](https://zhida.zhihu.com/search?content_id=235980729&content_type=Article&match_order=1&q=%E5%AD%90%E5%9F%9F%E5%90%8D&zhida_source=entity)。当使用泛域名证书时，同一个证书可以保护多个同级子域名，这种证书通常使用通配符`*`来表示，如`*.example.com`，因此也被称为通配符SSL证书。
- 泛域名证书只能匹配同级别的子域名，不能跨级匹配。例如，`*.shinerio.site`的域名证书匹配`wiki.shinerio.site`、`learn.shinerio.site`等子域名，但是不匹配`guide.demo.shinerio.site`、`developer.demo.shinerio.site`等域名。
- 泛域名证书一般仅支持申请单个通配符域名的证书，不支持多通配符域名的证书，如`*.*.shinerio.site`
泛域名证书的一个主要优势是，它可以适用于未来增加的子域名，无需为每个新的子域名单独购买和安装SSL证书。另外，泛域名证书还可以**简化证书管理和配置**。
## 1.2. 单域名证书
如其名称所示，单域名证书仅适用于一个域名或子域名。这意味着，如果有多个域名或子域名需要保护，就需要为每个域名或子域名分别购买和安装单域名证书。单域名证书的优点是在特定于某个域名的通信中，提供了**更高的安全性和保护级别**。与泛域名证书相比，单域名证书的价格更为**经济实惠**。
# 2. 证书类型
在 SSL/TLS 证书体系中，DV（Domain Validation）、OV（Organization Validation）和 EV（Extended Validation）是根据**验证级别**和**信任等级**划分的三种类型，主要区别体现在**验证流程严格程度**、**信任标识**、**适用场景**等方面。

| **维度**     | **DV 证书（域名验证）**       | **OV 证书（组织验证）**                   | **EV 证书（扩展验证）**                                |
| ---------- | --------------------- | --------------------------------- | ---------------------------------------------- |
| **验证内容**   | 仅验证域名所有权（DNS / 文件验证等） | 验证域名所有权 + **组织真实性**（工商注册信息、联系方式等） | 验证域名所有权 + **组织真实性** + **严格身份审核**（法律文件、运营地址核实等） |
| 安全等级       | 一般                    | 高                                 | 最高                                             |
| **验证机构审核** | 自动或简单人工审核（最快几分钟完成）    | 人工审核组织信息（需 1-5 个工作日）              | 第三方机构深度审核（需 5-10 个工作日或更久）                      |
| **证书价格**   | 最低（几十到几百元 / 年）        | 中等（数百到数千元 / 年）                    | 最高（数千元到数万元 / 年）                                |
| **证书有效期**  | 通常 1-2 年              | 通常 1-3 年                          | 通常 1-3 年                                       |

DV vs OV
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory20250604220737.png)

## 2.1. DV 证书（域名验证）
仅包含**域名信息**（通常在`CN`字段），**无组织信息**（如公司名称、地址等）。    
```plaintext
CN = example.com          # 仅域名，无组织名
```
DV证书仅验证域名所有权，无需审核组织资质，因此不包含企业信息。
## 2.2. OV 证书（组织验证）
包含**完整的组织信息**，至少包括：
- `CN`（Common Name）：域名或子域名（如`www.example.com`）。
- `O`（Organization）：组织名称（如 “北京某科技有限公司”）。
- `C`（Country）：国家代码（如 “CN”）。
- 部分证书可能包含`L`（Locality，地区）、`ST`（State，州 / 省）等。  
```plaintext
CN = www.example.com 
O = 北京某科技有限公司 
C = CN 
ST = 北京市 
L = 朝阳区
```
OV 证书需验证组织真实性，因此必须包含工商注册的企业名称及基本信息。
## 2.3. EV 证书（扩展验证）
**组织信息最完整**，除包含 OV 证书的所有字段外，可能额外包含：
- `OU`（Organizational Unit，组织单元，如 “信息技术部”）。
- `STREET`（街道地址，用于物理地址验证）。
**关键区别**：EV 证书的`Subject`字段中的组织名称需与**工商数据库完全一致**，且可能通过`subjectAltName`扩展字段包含更多域名。
如下是中国银行证书的subject部分
```plaintext
CN = www.boc.cn
O = Bank of China Limited
ST = Beijing
C = CN
serialNumber = 911000001000013428
businessCategory = Private Organization
jurisdictionStateOrProvinceName = Beijing
jurisdictionCountryName = CN  
```
查看issuser也可以看出为EV证书
```plaintext
CN = DigiCert Secure Site Pro EV G2 TLS CN RSA4096 SHA256 2022 CA1
O = DigiCert, Inc.
C = US
```
EV 证书需通过严格的身份审核（如法律文件、运营地址核实），因此组织信息最详细且真实可查。
# 3. 证书内容解析
x.509证书是一种广泛使用的数字证书标准，用于在网络通信中验证实体（如服务器、客户端、用户）的身份，并确保数据传输的安全性和完整性。它是公钥基础设施（PKI，Public Key Infrastructure）的核心组成部分，常见于 HTTPS、VPN、电子邮件加密等场景
如下是一个google公钥证书。
![[www.google.com.pem]]
使用如下命令查看证书内容
```shell
openssl x509 -in www.google.com.pem -text -noout
```
输出如下
```
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            43:eb:8c:7c:8d:cc:8f:44:10:64:56:21:46:d3:f0:26
        Signature Algorithm: ecdsa-with-SHA256
        Issuer: C=US, O=Google Trust Services, CN=WE2
        Validity
            Not Before: Jan  6 08:38:03 2025 GMT
            Not After : Mar 31 08:38:02 2025 GMT
        Subject: CN=www.google.com
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (256 bit)
                pub: 
                    04:66:80:6e:cb:6d:2a:dc:81:12:96:39:38:7f:26:
                    c0:e1:0f:19:f6:67:f6:a8:cf:ae:c1:7b:f6:55:e7:
                    92:7e:57:73:fd:24:a1:66:d1:22:ec:d8:ba:d6:3d:
                    23:3e:5b:77:03:6c:02:18:66:a4:05:69:9a:95:1f:
                    05:c8:8c:01:46
                ASN1 OID: prime256v1
                NIST CURVE: P-256
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature
            X509v3 Extended Key Usage: 
                TLS Web Server Authentication
            X509v3 Basic Constraints: critical
                CA:FALSE
            X509v3 Subject Key Identifier: 
                87:26:06:BF:75:D5:44:29:C0:08:6F:D9:51:1E:32:28:94:46:26:40
            X509v3 Authority Key Identifier: 
                keyid:75:BE:C4:77:AE:89:F6:44:37:7D:CF:B1:68:1F:1D:1A:EB:DC:34:59

            Authority Information Access: 
                OCSP - URI:http://o.pki.goog/we2
                CA Issuers - URI:http://i.pki.goog/we2.crt

            X509v3 Subject Alternative Name: 
                DNS:www.google.com
            X509v3 Certificate Policies: 
                Policy: 2.23.140.1.2.1

            X509v3 CRL Distribution Points: 

                Full Name:
                  URI:http://c.pki.goog/we2/dTM3-0hpWfE.crl

            1.3.6.1.4.1.11129.2.4.2: 
                ......v.Nu.'\...8[l..?R.......i...d.b.9.....:........G0E. TR/I....n.(....>i...\r....)...P..!.......hB....~...N...B4..9./....v.v.....P$|k...V7....+E6.....2u:.AU. Z..j.'....'4@....#(.?.....q...L.?]
    Signature Algorithm: ecdsa-with-SHA256
         30:45:02:21:00:ea:41:14:8a:23:05:1f:70:25:d0:36:d5:f4:
         91:f0:9a:40:f3:77:e6:b5:cb:b2:21:ca:ca:8b:f2:b0:6c:a1:
         68:02:20:49:a6:3b:e9:b4:bf:1e:41:aa:05:dd:50:7e:4a:93:
         4e:6d:61:e7:b8:04:d0:55:fc:44:80:a3:67:c4:a2:46:3b
```
## 3.1. 基本信息
- **版本**：X.509 v3（0x2）
- **序列号**：`43:eb:8c:7c:8d:cc:8f:44:10:64:56:21:46:d3:f0:26`（由颁发机构分配的唯一标识符）
- **签名算法**：ecdsa-with-SHA256
## 3.2. 颁发者（Issuer）
- **国家**（C，Country）：US（美国）
- **组织**（O，organization）：Google Trust Services。CA 所属的组织或公司名称（如 “DigiCert Inc”“Let’s Encrypt”）。
- **通用名称**（CN，Common Name）：WE2（Google的Web PKI证书颁发机构）。CA 的完整标识名称，通常是CA的全称或域名（如 “DigiCert Inc”等）。
如下是中行证书的issuer部分
```plaintext
CN = DigiCert Secure Site Pro EV G2 TLS CN RSA4096 SHA256 2022 CA1
O = DigiCert, Inc.
C = US
```
## 3.3. 有效期（Validity）
- **生效日期**：2025年1月6日 08:38:03 GMT
- **过期日期**：2025年3月31日 08:38:02 GMT
## 3.4. 主体（Subject）
- **通用名称**(CN，common name)：www.google.com（证书所属网站）
## 3.5. 公钥信息
- **算法**：id-ecPublicKey（椭圆曲线公钥）
- **密钥长度**：256 位
- **公钥值**：04:66:80:6e:cb:6d:2a:dc...（略）
- **曲线类型（ASN1 OID）**：prime256v1（也称为NIST P-256）
## 3.6. X.509 v3扩展
- **密钥用途**：Digital Signature（数字签名）
- **扩展密钥用途**：TLS Web Server Authentication（TLS网站服务器认证）
- **基本约束**：CA:FALSE（表明这不是CA证书，不能用于签发其他证书）
- **主体密钥标识符**：87:26:06:BF...（略）
- **授权密钥标识符**：75:BE:C4:77...（略）（用于识别签发证书的CA的公钥）
### 3.6.1. 权威信息访问（Authority Information Access）
- **OCSP（Online Certificate Status Protocol）**：[http://o.pki.goog/we2（在线证书状态协议，用于检查证书是否被吊销）](http://o.pki.goog/we2%EF%BC%88%E5%9C%A8%E7%BA%BF%E8%AF%81%E4%B9%A6%E7%8A%B6%E6%80%81%E5%8D%8F%E8%AE%AE%EF%BC%8C%E7%94%A8%E4%BA%8E%E6%A3%80%E6%9F%A5%E8%AF%81%E4%B9%A6%E6%98%AF%E5%90%A6%E8%A2%AB%E5%90%8A%E9%94%80%EF%BC%89)
- **CA签发者（CA Issuers）**：[http://i.pki.goog/we2.crt（CA证书下载地址）](http://i.pki.goog/we2.crt%EF%BC%88CA%E8%AF%81%E4%B9%A6%E4%B8%8B%E8%BD%BD%E5%9C%B0%E5%9D%80%EF%BC%89)
### 3.6.2. 主体备用名称
- **DNS**：[www.google.com（证书保护的域名）](http://www.google.com%EF%BC%88%E8%AF%81%E4%B9%A6%E4%BF%9D%E6%8A%A4%E7%9A%84%E5%9F%9F%E5%90%8D%EF%BC%89)
### 3.6.3. 证书策略
- **策略**：2.23.140.1.2.1（表示域名验证证书）
### 3.6.4. CRL分发点
- **URI**：[http://c.pki.goog/we2/dTM3-0hpWfE.crl（证书吊销列表的位置）](http://c.pki.goog/we2/dTM3-0hpWfE.crl%EF%BC%88%E8%AF%81%E4%B9%A6%E5%90%8A%E9%94%80%E5%88%97%E8%A1%A8%E7%9A%84%E4%BD%8D%E7%BD%AE%EF%BC%89)
### 3.6.5. 签名算法和签名值
- **摘要算法**：ecdsa-with-SHA256
- **值**：30:45:02:21:00:ea:41...（略）（CA对证书内容的签名，CA私钥加密）
# 4. 合法性校验
## 4.1. 验证证书链
证书链从根证书开始，并且证书链中的每一级证书所标识的实体都要为其下一级证书签名，而根证书自身则由证书颁发机构签名。客户端在验证证书链时，必须对链中所有证书的数字签名进行验证，直到达到根证书为止。

详细步骤如下：
- 获取颁发该证书的CA证书（[http://i.pki.goog/we2.crt）](http://i.pki.goog/we2.crt%EF%BC%89)
- 验证证书是由可信CA签发的（Google Trust Services是知名可信CA）
- 确认完整的证书链直到根证书

现代浏览器和操作系统会自动执行这些步骤：
1. 接收服务器提供的证书链
2. 检查每个证书是否由上一级证书正确签名
3. 追溯到预装的可信根证书
4. 检查证书是否过期或被吊销
5. 如果验证成功，显示安全连接；失败则显示警告

对于上述Google证书，完整的证书链应该是：
- 终端实体证书：CN=[www.google.com](http://www.google.com)
- 中间证书：C=US, O=Google Trust Services, CN=WE2
- Google Trust Services根证书（已预装在大多数操作系统和浏览器中）
以B站证书为例
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory20250401223628.png)
## 4.2. 检查有效期
确认当前日期在证书的有效期内（2025年1月6日至2025年3月31日）
## 4.3. 验证域名
确认Subject和SAN（Subject Alternative Name）中的域名与您访问的网站匹配（[www.google.com）](http://www.google.com%EF%BC%89)
## 4.4. 验证证书状态
通过OCSP（[http://o.pki.goog/we2）或CRL（http://c.pki.goog/we2/dTM3-0hpWfE.crl）检查证书是否被吊销](http://o.pki.goog/we2%EF%BC%89%E6%88%96CRL%EF%BC%88http://c.pki.goog/we2/dTM3-0hpWfE.crl%EF%BC%89%E6%A3%80%E6%9F%A5%E8%AF%81%E4%B9%A6%E6%98%AF%E5%90%A6%E8%A2%AB%E5%90%8A%E9%94%80)
## 4.5. 验证签名
使用CA的公钥验证证书上的签名，`openssl verify -CAfile we2.crt www.google.com.pem`
### 4.5.1. 签名内容
当验证证书签名时，系统会对证书的**所有内容**（除了签名本身）生成摘要，具体包括：
- 版本号(Version)
- 序列号(Serial Number)
- 签名算法标识符(Signature Algorithm)
- 颁发者信息(Issuer)
- 有效期(Validity)
- 证书主体信息(Subject)
- 公钥信息(Subject Public Key Info)
- 所有X.509 v3扩展内容
实际上，这相当于证书的整个DER编码的**TBSCertificate**（To Be Signed Certificate）部分。
### 4.5.2. 验证签名过程
详细过程如下：
1. 提取CA证书的公钥
2. 使用CA公钥对签名（证书中的最后部分：`30:45:02:21:00:ea:41...`）进行解密，得到摘要值
3. 使用摘要算法（SHA256）对TBSCertificate计算摘要值
4. 比较两个计算的摘要是否相等
> [!note]
> ECDSA (Elliptic Curve Digital Signature Algorithm) 是一种数字签名算法，它基于椭圆曲线密码学原理。这是一种现代密码学技术，相比传统的RSA算法，可以使用更短的密钥提供同等级别的安全性
#### 4.5.2.1. 检查证书透明度
查询证书透明度日志，确认证书已被记录（SCT信息部分）
#### 4.5.2.2. 检查密钥用途
确认证书用途符合预期（此证书用于TLS Web服务器认证）
# 5. 常见文件格式
## 5.1. PEM（Privacy - Enhanced Mail）
是一种常用的证书或私钥存储格式。它是一种文本格式，以-----BEGIN...-----开头，以-----END...-----结尾。内容主要包括Base64编码的数据。如果是PEM格式的公钥证书，其中就包含证书信息；若是PEM格式的私钥，就包含私钥数据。
## 5.2. P12（也称为PFX）
是一种文件格式，用于存储包含公钥、私钥和证书的加密信息包。它是一种二进制格式，主要用于在不同的应用程序和系统之间交换和存储加密密钥和相关证书。这种格式可以方便地将所有必要的安全组件（如个人证书、中间证书、根证书和与之匹配的私钥）打包在一起，并且可以使用密码进行保护，确保只有知道密码的授权用户才能访问其中的内容。
## 5.3. JKS（Java Key Store）
是Java的密钥库格式。它可以存储多种加密元素，包括私钥、公钥证书以及证书链。证书链是一组按顺序排列的证书，从服务器证书开始，到中间证书，最后是根证书。这些元素在JKS文件中被安全地保存起来，用于Java应用程序中的安全通信和身份验证。
 
在Java应用程序（如Spring应用）中广泛用于配置SSL/TLS通信。例如，在基于Java的Web服务器中，服务器的私钥和证书可以存储在JKS文件中，然后在服务器启动时加载这个JKS文件来建立安全的HTTPS连接。

JKS文件是二进制格式，并且可以通过密码进行保护。这意味着只有知道密码的用户才能访问和使用存储在其中的密钥和证书。这种加密保护有助于防止密钥和证书被未授权的访问和滥用。
## 5.4. crt格式
.crt文件通常用于存储证书。证书包含了公钥信息、证书所有者（如个人、公司或服务器）的身份信息、证书颁发机构（CA）的数字签名等。这些信息用于在网络通信等场景中验证身份。例如，在SSL/TLS加密通信中，服务器会将.crt文件中的公钥证书发送给客户端，客户端通过验证证书签名来确认服务器身份合法性。
## 5.5. key格式
.key文件主要用于存储私钥。私钥是加密系统中的关键部分，用于解密由对应的公钥加密的数据，以及进行数字签名。它必须严格保密，因为如果私钥泄露，可能会导致安全问题，如信息被解密或伪造数字签名。

加密私钥
```shell
# --aes256是加密算法
openssl rsa -aes256 -in private_decrypted.key -out private_encrypted.key
```

解密私钥
```shell
openssl rsa -in private_encrypted.key -out private_decrypted.key
# 解密，输入密码后明文输出
openssl rsa -text -noout -in private_encrypted.key
```


# 6. ref
https://pandaychen.github.io/2019/07/24/auth/
https://www.cnblogs.com/enoc/p/tls-handshake.html
https://www.nervos.org/zh/knowledge-base/understanding_ECDSA_(explainCKBot)
