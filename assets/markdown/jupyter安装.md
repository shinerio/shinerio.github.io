z从sqlite官网`cnblogs.com/staff/p/12763019.html`，下载安装最新版本sqlite3

清理旧版本的sqlite3
```
# 临时重命名或移除系统旧版本（谨慎操作）
sudo mv /usr/lib64/libsqlite3.so /usr/lib64/libsqlite3.so.backup
sudo mv /usr/lib64/libsqlite3.so.0 /usr/lib64/libsqlite3.so.0.backup

# 更新链接器配置，确保 /usr/local/lib 优先
echo "/usr/local/lib" | sudo tee -a /etc/ld.so.conf.d/local.conf
sudo ldconfig

# 验证链接器现在找到的是正确版本
ldconfig -p | grep sqlite
```

安装并编译python环境
```
yum install libffi-devel

./configure \
    --enable-optimizations \
    CPPFLAGS="-I/usr/local/include" \
    LDFLAGS="-L/usr/local/lib" \
    SQLITE3_CFLAGS="-I/usr/local/include" \
    SQLITE3_LIBS="-L/usr/local/lib -lsqlite3"

make clean
make -j$(nproc)
make altinstall
```
配置jupyter lab
```
jupyter lab --generate-config
jupyter lab password
jupyter lab --ip=0.0.0.0 --port=14445 --no-browser --allow-root
```

添加python环境
```
/usr/local/bin/pip3.13 install ipykernel
/usr/local/bin/python3.13 -m ipykernel install --user --name=python313
```

# 1. 格式转换
```
jupyter nbconvert --to html vector.ipynb
jupyter nbconvert --to markdown vector.ipynb
jupyter nbconvert --to pdf vector.ipynb
```