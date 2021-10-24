---
title: openssl & keytool
date: 2021-10-24
categories:
- 网络安全
tags:
- 网络安全
- 加密
- linux
---
openssl 是目前最流行的 SSL 密码库工具，其提供了一个通用、健壮、功能完备的工具套件，用以支持SSL/TLS 协议的实现。keytool可以用来管理秘钥和证书，并保存在keystore文件中。
<!--more-->

## 1. 常见文件格式

- .csr 证书签名请求。某些应用程序可以生成这些文件以提交给证书颁发机构。实际格式为PKCS10，它在RFC 2986中定义。它包括所请求证书的一些/全部密钥详细信息，例如主题，组织，状态，诸如此类，以及要签名的证书的公共密钥。这些由CA签名并返回证书。返回的证书是公用证书（包括公用密钥，但不包含专用密钥）
- .pem 在RFC 1421至1424中定义，这是一种容器格式，可以只包含公共证书（例如Apache安装和CA证书文件/etc/ssl/certs），或者可以包括完整的证书链，包括公共密钥，私钥和根证书
- .key 这是PEM格式的文件，仅包含特定证书的私钥。在Apache安装中，该位置通常位于中/etc/ssl/private。这些文件的权限非常重要，如果设置错误，某些程序将拒绝加载这些证书。
- .pkcs12 .pfx .p12 最初由RSA在“ 公钥密码标准”（缩写为PKCS）中定义，“ 12”变体最初由Microsoft增强，后来提交为RFC 7292。这是包含公共和私有证书对的密码容器格式。与.pem文件不同，此容器是完全加密的。Openssl可以使用公钥和私钥将其转换为.pem文件：openssl pkcs12 -in file-to-convert.p12 -out converted-file.pem -nodes

除此之外，还有几种其他几种格式：

- .der-一种以二进制形式编码ASN.1语法的方法，.pem文件只是Base64编码的.der文件。OpenSSL可以将它们转换为.pem（openssl x509 -inform der -in to-convert.der -out converted.pem）。Windows将这些视为证书文件。默认情况下，Windows会将证书导出为扩展名为.DER格式的文件。
- .cert .cer .crt都是.pem（或很少是.der）格式的文件，具有不同的扩展名，Windows Explorer将其识别为证书，而.pem则不是。
- .p7b .keystore 在RFC 2315中定义为PKCS 7，这是Windows用于证书交换的一种格式。Java本身了解这些内容，因此通常将其.keystore用作扩展。与.pem样式证书不同，此格式具有定义的方式来包括证书路径证书。
- .crl-证书吊销列表。证书颁发机构产生这些证书是作为在到期之前取消对证书进行授权的一种方式。有时您可以从CA网站下载它们。

## 2. 自签ssl证书

自签名SSL证书是由创建它的人而不是受信任的证书颁发机构签名的证书。自签名证书可以与受信任的CA签名SSL证书具有相同的加密级别。被任何浏览器识别为有效的自签名证书。如果您使用的是自签名证书，则网络浏览器将向访问者显示警告，提示该网站证书无法验证。
自签名证书主要用于测试目的或内部使用，不应该在暴露于Internet的生产系统中使用自签名证书。

```shell
openssl req -newkey rsa:4096 \
            -x509 \
            -sha256 \
            -days 3650 \
            -nodes \
            -out example.crt \
            -keyout example.key \
			-subj "/C=CN/ST=BEIJING/L=BEIJING/O=SHINERIO/OU=SHINERIO/CN=www.shinerio.cc"
```

- -newkey rsa:4096 创建新的证书请求和4096位RSA密钥。默认值为2048位。
- -x509 创建X.509证书。
- -sha256 使用265位SHA（安全哈希算法）。
- -days 3650 认证证书的天数。 3650是10年。
- -nodes 创建没有密码的密钥。
- -out example.crt 指定新创建的证书的文件名。
- -keyout example.key 指定新创建的私钥的文件名。
- -subj 证书信息=
	- C= 国家/地区名称。 ISO的两个字母缩写。
	- ST= 州或省名。
	- L= 地区名称。您所在的城市的名称。
	- O= 您组织的全名。
	- OU= 组织单位。
	- CN= 完全限定的域名。

> 如上导出的example.crt即为证书(公钥)，.key为私钥公私钥都是明文存储的。

### 2.1 私钥加密

#### 2.1.1 创建加密的私钥
openssl genrsa -des3 -out example.key 1024

- -des3:生成的密钥使用des3方式进行加密。
- -out private-rsa.key:将生成的私钥保存至example.key文件。
- 1024为要生成的私钥的长度。

#### 2.1.2 使用已有私钥创建ssl证书

```shell
openssl req -new \
            -key example.key \
            -x509 \
            -sha256 \
            -days 3650 \
            -out example.crt \
            -keyout example.key \
			-subj "/C=CN/ST=BEIJING/L=BEIJING/O=SHINERIO/OU=SHINERIO/CN=www.shinerio.cc"
```

##### 2.1.3 直接创建有密码的ssl证书

```shell
openssl req -newkey rsa:4096 \
            -x509 \
            -sha256 \
            -days 3650 \
            -out example.crt \
            -keyout example.key \
			-subj "/C=CN/ST=BEIJING/L=BEIJING/O=SHINERIO/OU=SHINERIO/CN=www.shinerio.cc"
```

## 2.2 查看私钥明细

```shell
openssl rsa -in example.key -noout -text
```

## 2.3 转换命令

- 加密私钥转非加密

```shell
openssl rsa -in example.key -passin pass:shinerio -out example_unencrypt.key
```

- 非加密私钥转加密
  
 ```shell
openssl rsa -in example_unencrypt.key -aes256 -passout pass:shinerio -out example_encrypt.key
```


## 3. 生成签名请求及CA 签名

```shell
openssl genrsa -aes256 -passout pass:shinerio -out server.key 2048
openssl req -new \
                        -key server.key \
						-passin pass:shinerio -out server.csr \
			            -subj "/C=CN/ST=BEIJING/L=BEIJING/O=SHINERIO/OU=SHINERIO/CN=www.shinerio.cc"
```

 生成的 csr签名请求文件可提交至 CA进行签发。使用 CA 证书及CA密钥对请求签发证书进行签发，生成 x509证书

openssl x509 -req -days 3650 -in server.csr -CA ca.crt -CAkey ca.key -passin pass:shinerio -CAcreateserial -out server.crt

### 3.1合成 pkcs#12 证书(含私钥)
```shell
openssl pkcs12 -export -in server.crt -inkey server.key -passin pass:shinerio -password pass:shinerio -out server.p12
```

### 3.2 将证书和私钥/CA 证书 合成pkcs#12 证书
```shell
openssl pkcs12 -export -in server.crt -inkey server.key -passin pass:shinerio -chain -CAfile ca.crt -password pass:shinerio -out server-all.p12
```
其中-chain指示同时添加证书链，-CAfile 指定了CA证书，导出的p12文件将包含多个证书。(其他选项：-name可用于指定server证书别名；-caname用于指定ca证书别名)

### 3.3 pcks#12 提取PEM文件(含私钥)
```shell
openssl pkcs12 -in server.p12 -password pass:shinerio -passout pass:shinerio -out server.pem
```
其中-password 指定 p12文件的密码(导入导出)，-passout指输出私钥的加密密码(nodes为无加密)，导出的文件为pem格式，同时包含证书和私钥。

- 仅提取私钥
```shell
 openssl pkcs12 -in server.p12 -password pass:shinerio -passout pass:shinerio -nocerts -out key.pem
```
- 仅提取证书(所有证书)
```shell
 openssl pkcs12 -in server.p12 -password pass:shinerio -nokeys -out all_certs.pem
 ```
- 仅提取ca证书
```shell
openssl pkcs12 -in server-all.p12 -password pass:shinerio -nokeys -cacerts -out cacert.pem 
```
- 仅提取server证书
```shell
openssl pkcs12 -in server-all.p12 -password pass:111111 -nokeys -clcerts -out srever.pem
```

## 4. JKS
JKS（Java Key Store）就是利用Java Keytool 工具生成的Keystore文件，JKS文件由公钥和密钥构成，其中的公钥就是我们所说的证书，即cer为后缀的文件，而私钥就是密钥，即以key为后缀的文件。

### 4.1 生成jks文件

```shell
keytool -genkeypair -keyalg rsa -keysize 2048 -storetype JKS -alias cert -keypass shinerio -validity 3650 -storepass shinerio -keystore D:/example.jks -dname "CN=shinerio.cc, OU=shinerio, O=shinerio, L=BEIJING, ST=BEIJING, C=CN"
```

**选项:**
 - -alias <alias>                  要处理的条目的别名
 - -keyalg <keyalg>                密钥算法名称
 - -keysize <keysize>              密钥位大小
 - -sigalg <sigalg>                签名算法名称
 - -destalias <destalias>          目标别名
 - -dname <dname>                  唯一判别名
 - -startdate <startdate>          证书有效期开始日期/时间
 - -ext <value>                    X.509 扩展
 - -validity <valDays>             有效天数
 - -keypass <arg>                  密钥口令
 - -keystore <keystore>            密钥库名称
 - -storepass <arg>                密钥库口令
 - -storetype <storetype>          密钥库类型
 - -providername <providername>    提供方名称
 - -providerclass <providerclass>  提供方类名
 - -providerarg <arg>              提供方参数
 - -providerpath <pathlist>        提供方类路径
 - -v                              详细输出
 - -protected                      通过受保护的机制的口令
 - -storepasswd  修改keystore密码
 - -keypasswd   更改指定证书的密钥口令

使用 "keytool -help" 获取所有可用命令

### 4.2 列出keystore中的证书
```shell
keytool -list -v -keystore D:/example.jks -storepass shinerio
```

### 4.3 查看指定证书详情

```shell
keytool -list -v -alias cert -keystore D:/example.jks -storepass shinerio
```shell

### 4.4 删除指定证书

```shell
keytool -delete -keystore D:/example -alias cert -storepass shinerio
```

### 4.5 修改keystore密码

```shell
keytool -storepasswd -keystore D:/example.jks -storepass shinerio 
```

### 4.6 修改指定证书密码

```shell
keytool -keypasswd -alias cert -keystore D:/example.jks -storepass shinerio
```

> 如果 -storetype 为 PKCS12, 则不支持 -keypasswd 命令