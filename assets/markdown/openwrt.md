```shell
docker network create -d macvlan --subnet=192.168.85.0/24 --gateway 192.168.85.1 -o parent=eth0 mac-net
docker pull esirpg/buddha:latest
docker run -d \
  --restart always \
  --name esirpg-buddha \
  --privileged \
  --network mac-net \
  --ip=192.168.85.10 \
  esirpg/buddha:latest \
  /sbin/init
```