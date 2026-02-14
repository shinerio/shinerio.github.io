# 1. docker 安装
注意要通过环境变量配置代理，否则无法访问themoviedb或thetvdb等
```shell
    docker run -itd \
        --name moviepilot-v2 \
        --hostname moviepilot-v2 \
        --network host \
        -v /vol2/1000/MoviePilot:/media \
        -v /moviepilot-v2/config:/config \
        -v /moviepilot-v2/core:/moviepilot/.cache/ms-playwright \
        -v /var/run/docker.sock:/var/run/docker.sock:ro \
        -e 'NGINX_PORT=3000' \
        -e 'PORT=3001' \
        -e 'PUID=0' \
        -e 'PGID=0' \
        -e 'UMASK=000' \
        -e 'TZ=Asia/Shanghai' \
        -e 'SUPERUSER=admin' \
        -e 'http_proxy=http://127.0.0.1:7890' \
        -e 'https_proxy=http://127.0.0.1:7890' \
        -e 'PROXY_HOST=http://127.0.0.1:7890' \
        --restart always \
        jxxghp/moviepilot-v2:latest
```

# 2. 下载与整理
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory20250521234742.png)

可以通过软连接目录的方式达到下载目录和mp的/media目录一致。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory20250521234855.png)

# 3. ref
https://wiki.movie-pilot.org/zh/install