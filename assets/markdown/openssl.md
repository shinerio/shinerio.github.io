# 1. RSA密钥
生成私钥
- `-algorithm RSA`：指定算法为 RSA
- `-pkeyopt rsa_keygen_bits:2048`：指定密钥长度为 2048 位（可改为 4096
- `-out rsa_private.pem`：输出私钥文件路径
```shell
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
```
生成公钥
- `-in rsa_private.pem`：输入私钥
- `-pubout`：导出公钥
- `-out rsa_public.pem`：输出公钥文件路径
```shell
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

# 2. ECC密钥
生成对应的ECC私钥
- `-name prime256v1`：指定椭圆曲线（可换成 `secp256k1`, `secp384r1`, `secp521r1`, `X25519` 等）
- `-genkey`：生成密钥
- `-noout`：不显示额外信息
- `-out ecc_private.pem`：输出ECC私钥路径
```shell
openssl ecparam -name prime256v1 -genkey -noout -out ecc_private.pem
```
生成对应的ECC公钥
- `-in ecc_private.pem`：输入私钥
- `-pubout`：导出公钥
- `-out ecc_public.pem`：输出公钥路径
```shell
openssl ec -in ecc_private.pem -pubout -out ecc_public.pem
```
# 3. SM2密钥（国密）
SM2是中国标准的椭圆曲线密码算法，需要 `openssl` 支持国密（如 OpenSSL 1.1.1 以上的版本）。

生成SM2私钥
```shell
openssl ecparam -name SM2 -genkey -noout -out sm2-key.pem
```
生成公钥
```shell
openssl ec -in sm2-key.pem -pubout -out sm2pubkey.pem
```

# 4. Ed25519
```
# 生成pkcs#8格式私钥
openssl genpkey -algorithm ED25519 -out ca.key

```