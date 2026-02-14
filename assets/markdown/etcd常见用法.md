# 1. 数据put和get
## 1.1. 设置key和value
```shell
etcdctl put /app "myapp"
etcdctl put /app/config/database/host "127.0.0.1"
etcdctl put /app/config/database/port "5432"
etcdctl put /app/config/api/timeout "3000"
etcdctl put /app/config/api/retries "3"
etcdctl put /app/metrics/requests_count "100"
etcdctl put /app/metrics/errors_count "5"
```
## 1.2. 获取指定key
```shell
# etcdctl get /app
/app
myapp
```
## 1.3. 获取前缀下所有key
```shell
etcdctl get --prefix --keys-only /
/app
/app/config/api/retries
/app/config/api/timeout
/app/config/database/host
/app/config/database/port
/app/metrics/errors_count
/app/metrics/requests_count
```
# 2. 数据过期与续约
## 2.1. 创建租约并设置 TTL（Time To Live）
创建一个 TTL 为 60 秒的租约：
```bash
etcdctl lease grant 10
```
 该命令会返回一个租约ID，例如 `lease ID: 694d95c322cd3623`
## 2.2. 查看所有lease
```shell
root@VM-0-10-ubuntu:/home/ubuntu/etcd# etcdctl lease grant 10
lease 694d95c322cd3645 granted with TTL(10s)
root@VM-0-10-ubuntu:/home/ubuntu/etcd# etcdctl lease grant 20
lease 694d95c322cd3647 granted with TTL(20s)
root@VM-0-10-ubuntu:/home/ubuntu/etcd# etcdctl lease list
found 2 leases
694d95c322cd3645
694d95c322cd3647
```
## 2.3. 将键与租约关联
使用上述租约 ID 将键值对与租约关联
```bash
etcdctl put /app/config/database/host "127.0.0.1" --lease=694d95c322cd3623
```
 这样，`/app/config/database/host` 这个键值对就与TTL为10秒的租约关联起来了，10秒后如果没有续约，该键值对将被自动删除。
 > [!note]
 > 1. 数据的过期时间是以lease创建的时间为准。
 > 2. 一个lease可以关联多个key，lease到期后，所有的key都会被删除
 > 3. 如果lease到期后，再关联数据会报错。Error: etcdserver: requested lease not found
## 2.4. 续约租约
可以在租约到期前通过以下命令续约：
```bash
etcdctl lease keep-alive 694d95c322cd3623
```
该命令会重新刷新有效期，如果客户端保持连接并定期发送续约请求，租约就不会过期，与之关联的键值对也会一直存在。
## 2.5. 撤销租约
当需要提前删除与租约关联的键值对时，可以使用以下命令撤销租约：
```bash
etcdctl lease revoke 694d95c322cd3623
```
执行该命令后，与该租约关联的所有键值对都会被删除。