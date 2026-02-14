windows下必须使用bridge模式
# 1. docker安装
```bash
# bridge模式一键安装
docker run -d --restart=always --name="xiaoya" -p 5678:80 -p 2345:2345 -p 2346:2346 -v D:\Media\xiaoya:/data xiaoyaliu/alist:latest
# host模式一键安装
bash -c "$(curl http://docker.xiaoya.pro/update_new.sh)" -s host
```

# 2. 定时清理

```shell
bash -c "$(curl -s https://xiaoyahelper.ddsrem.com/aliyun_clear.sh | tail -n +2)" -s 3
```

# 3. 获取元数据
在wsl的ubuntu子系统中执行
```shell
# 生成配置，windows下必须使用bridge模式
bash -c "$(curl http://docker.xiaoya.pro/emby_new.sh)" -s --config_dir=/mnt/d/Media/xiaoya --media_dir=/mnt/d/Media/xiaoya/media --action=generate_config
# 执行安装
bash -c "$(curl http://docker.xiaoya.pro/emby_new.sh)" 

```

# 4. 参考
[小雅Xiaoya TVbox/Jellyfin/EMBY 进阶之单独安装 Docker /群晖 独家保姆级教程 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/673584505#:~:text=App%20iOS%E3%80%81iPadOS%E3%80%81tvOS%E3%80%81MacOS%20PC%20Android%20TV,%20%20%20%0ADivHub%20%E2%88%9A)
[小雅媒体库终级板emby+infuse | KChen’s Blog](https://blog.kchen.cc/article/xiaoya-emby-media)