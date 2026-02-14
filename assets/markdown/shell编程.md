---
title: shell编程
date: 2023-01-24
categories:
- linux
tags:
- linux
---
本文主要介绍shell编程的基本语法以及实际应用中的常见命令。
# 1. 注释
## 1.1. 单行注释
```shell
# 这是单行注释
```
## 1.2. 多行注释
```shell
:<<EOF
多行注释内容
多行注释内容
多行注释内容
EOF
```
多行注释`EOF`也可替换成`!`或`'`
```shell
:<<'
多行注释内容
多行注释内容
多行注释内容
'

:<<!
多行注释内容
多行注释内容
多行注释内容
!
```
# 2. 变量
## 2.1. 变量定义
使用`VARIABLENAME=VALUE`的形式，VALUE如果是字符串的话，可以使用单引号、双引号或者不加引号。单引号内的任何字符都会原样输出，不能进行转义，单引号内不能单独出现一个单引号，但可成对出现，作为字符串拼接使用。双引号内可以有变量，可以出现转义字符。
## 2.2. 变量使用
只需要在变量前加`$`符号，变量加`{}`是可选的，方便解释器识别边界。将变量加上`{}`是一个好习惯，不容易出错。
```shell
your_age=25
your_name="shinerio"
your_name=shinerio
your_name='shinerio'
echo $your_age # 输出25
echo $your_name # 输出shinerio
echo "${your_name}hello" #这里{}必须添加，否则解释器认为是${your_namehello}
str='hello'' # 非法
str='hello'__'world' # 成对出现的单引号做字符拼接
echo $str #输出hello__world
str1='helloworld${your_age}\nnew line'
str2="helloworld${your_age}\nnew line"
echo $str1 # 输出helloworld${your_age}\nnew line
echo $str2 # 输出helloworld25\nnew line
echo -e $str2 # -e开启转义 \n表示换行 echo默认换行，通过\c强制不换行
#helloworld25
#new line
```
## 2.3. 只读变量
使用`readonly VARIABLENAME`设置变量只读，只读变量的值不能更改
```shell
readonly name='jack'
name='kelly'
zsh: read-only variable: name
```
## 2.4. 删除变量
使用`unset VARIABLENAME`删除变量。
# 3. 字符串操作
## 3.1. 字符串拼接
```shell
str1="hello"${your_name}"world"
str2="hello${your_name}world"
str3='hello'${your_name}'world'
```
## 3.2. 字符串长度
```shell
str='hello'
echo ${#str}
5
```
## 3.3. 字符串截取
`${string:start:length}`，索引从0开始，从start（包含）开始截取共计length长度的字符。
```shell
str='helloworld'
echo ${str:0:5}
hello
```
## 3.4. 字符串运算符

| 运算符 | 说明                                    | 举例                    |
| ------ | --------------------------------------- | ----------------------- |
| `=`    | 检测两个字符串是否相等，相等返回true    | `[ 'hello' = 'hello' ]` |
| `!=`   | 检测两个字符串是否相等，不相等返回true  | `[ 'hello' != 'ello' ]` |
| `-z`     | 检测字符串长度是否为0，为0返回true      | `[ -z '' ]`   | 
| `-n `    | 检测字符串长度是否不为0，不为0返回true | `[ -n 'hello' ]`  |
| `$`   | 检测字符串是否为空，不为空返回true     | `[ $'hello' ]`  |

```shell
if [ 'hello' = 'hello' ];then echo 'hello';fi
# hello
if [ 'hello' != 'ello' ];then echo 'hello';fi
# hello
if [ -z '' ];then echo 'hello';fi
# hello
if [ -n 'hello' ];then echo 'hello';fi
# hello
if [ $'hello' ];then echo 'hello';fi
str='hello'
if [ $str ];then echo 'hello';fi
# hello
```

注意字符串的等值判断是一个等号`"="`，与下文要讲的逻辑运算符使用两个等号`"=="`做等值判断不一样。
# 4. 文件测试运算符

| 操作符       | 说明                                      |
| --------- | --------------------------------------- |
| `-b file` | 检测文件是否是块设备文件，如果是，则返回true。               |
| `-c file` | 检测文件是否是字符设备文件，如果是，则返回true。              |
| `-d file` | 检测文件是否是目录，如果是，则返回true。                  |
| `-f file` | 检测文件是否是普通文件（既不是目录，也不是设备文件），如果是，则返回true。 |
| `-g file` | 检测文件是否设置了`SGID`位，如果是，则返回true。           |
| `-k file` | 检测文件是否设置了粘着位(Sticky Bit)，如果是，则返回true。   |
| `-p file` | 检测文件是否是有名管道，如果是，则返回true。                |
| `-u file` | 检测文件是否设置了`SUID`位，如果是，则返回true。           |
| `-r file` | 检测文件是否可读，如果是，则返回true。                   |
| `-w file` | 检测文件是否可写，如果是，则返回true。                   |
| `-x file` | 检测文件是否可执行，如果是，则返回true。                  |
| `-s file` | 检测文件是否为空（文件大小是否大于0），不为空返回true。          |
| `-e file` | 检测文件（包括目录）是否存在，如果是，则返回true。             |

```shell
if [[ -f '/home' ]];then echo 'directory';else echo 'file';fi
# file
if [[ -d '/home' ]];then echo 'directory';else echo 'file';fi
# directory
if [[ -e '/tmp/fake_file' ]];then echo 'exist';else echo 'not exist';fi
# not exist
```

# 5. 数组
`shell`只支持一维数组，用括号表示，元素通过空格分隔，形如`数组名=(值1 值2 ... 值n)`。`shell`数组下标从`1`开始。
- `${数组名[下标]}`，读取指索引位置数组元素
- 使用`@`或`*`代替下标，获取数组中所有元素。
- 使用`{#数组名[@]}`或`{#数组名[*]}`获取数组元素个数。

```shell
arr=(value1 value2 value3 value4)
echo ${arr[3]}
# value3
echo ${arr[*]} 
# value1 value2 value3 value4
echo ${arr[@]} 
# value1 value2 value3 value4
arr[3]='new_value3'
echo $arr[3]
# new_value3
echo ${#arr[@]}
# 4
echo "arr[1]的长度为:${#arr[1]}" 
# arr[1]的长度为:6
```

# 6. 运算符
## 6.1. 赋值运算符
```shell
a=10
b=$a
```
## 6.2. 算术运算符
算数运算符支持`+,-,*,/,%`
### 6.2.1. expr表示法
```shell
echo `expr 10 + 20`
# 30
echo $(expr 20 / 2)
# 10
echo $(expr 10 \* 20)  # 使用expr进行乘法运算时必须使用\进行转义
# 200
```
> 使用expr表示方法时，表达式和运算符之间必须有空格。
### 6.2.2. `$[]`
```shell
echo $[10%3]
# 1
```
### 6.2.3. `$(())`
```shell
echo $((10*20))
# 200
```

## 6.3. 关系运算符
最常见的关系运算符是：` ==,!=,<,>,>=,<= `
```shell
echo $[10==10]
# 1
flag=$[20==10]
echo $flag
# 1
echo $[10>=10]
# 1
```
如下关系运算符只能使用在条件表达式`if、while`下，类似`flag=[ $a -eq $b ]`的直接赋值语句是非法的。关系运算符的条件表达式要放在**一对**方括号中，并且中间需要有空格。也可以使用`(())`替代`[]`，此时`-eq,-lt,-le`之类的需要使用` ==,<,<= `等替换。

> `[]`搭配`-eq -ne`等使用，`(())`搭配`|| &&`等使用。

| 运算符 | 说明                                                  | 举例            |
| ------ | ----------------------------------------------------- | --------------- |
| `-eq`  | 检测两个数是否相等，相等返回true。                    | `[ $a -eq $b ]` |
| `-ne`  | 检测两个数是否不相等，不相等返回 true。               | `[ $a -ne $b ]` |
| `-gt`  | 检测左边的数是否大于右边的，如果是，则返回 true。     | `[ $a -gt $b ]` |
| `-lt`  | 检测左边的数是否小于右边的，如果是，则返回 true。     | `[ $a -lt $b ]` |
| `-ge`  | 检测左边的数是否大于等于右边的，如果是，则返回 true。 | `[ $a -ge $b ]` |
| `-le`  | 检测左边的数是否小于等于右边的，如果是，则返回 true。 | `[ $a -le $b ]` |

```shell
if [ 1 -eq 1 ];then echo 'hello';fi;
# hello
if ((10>=10));then echo 'hello';fi;
# hello
```

## 6.4. 布尔、逻辑运算符
布尔、逻辑运算的条件表达式也要放在一对方括号中`[]`。

| 运算符 | 说明 | 举例 |
| ----- | ----- | ----- |
| `!` | 非运算，表达式为true则返回false，否则返回true。 | `[ ! 10 -eq 0 ]` |
| `-o` | 或运算，有一个表达式为true则返回true。 | `[ 10 -lt 20 -o 10 -gt 100 ]` |
| `-a` | 与运算，两个表达式都为true才返回true。 |  `[ 10 -lt 20 -a 10 -gt 100 ]` |

```shell
if [ ! 10 -eq 0 ];then echo 'hello';fi
# hello
if [ 10 -ge 10 -a 10 -ge 10 ];then echo 'hello';fi
# hello
if [ 10 -ge 20 -o 10 -ge 0 ];then echo 'hello';fi
# hello
```

 `-o`也可以使用`||`替代，`-a`也可以使用`&&`替代，此时需要使用`(())`或`[[]]`替代`[]`。

```shell
if [[ 10==10 && 5==5 ]];then echo 'hello';fi
# hello
if ((10==10 && 5==5));then echo 'hello';fi
# hello
```

# 7. 传递参数
在执行 `Shell`脚本时，向脚本传递参数，脚本内获取参数的格式为：`$n`。`n`代表一个数字，`1`为执行脚本的第一个参数，`2`为执行脚本的第二个参数，`$0`为执行的文件名。在为`shell`脚本传递的参数中如果包含空格，应该使用单引号或者双引号将该参数括起来，以便于脚本将这个参数作为整体来接收。另外，还有几个特殊字符用来处理参数：

| 参数处理 | 说明                                                                                     |
| -------- | ---------------------------------------------------------------------------------------- |
| `$#`     | 传递到脚本的参数个数                                                                     |
| `$*`     | 以一个单字符串显示所有向脚本传递的参数，以`$1 $2 … $n`的形式输出所有参数。               |
| `$$`     | 脚本运行的当前进程ID号                                                                   |
| `$!`     | 后台运行的最后一个进程的ID号                                                             |
| `$@`     | 与`$*`相同，但是使用时加引号，并在引号中返回每个参数，以`$1 $2 … $n`的形式输出所有参数。 |
| `$-`     | 显示Shell使用的当前选项，与set功能相同。                                                 |
| `$?`     | 显示最后命令的退出状态。0表示没有错误，其他任何值表明有错误。                            |

编写`shell`脚本如下：
```bash
set -e
echo "执行的文件名：$0"
echo "参数个数为$#"
echo "第一个参数为：$1"
echo "第二个参数为：$2"
echo "所有参数为：$@"
echo "进程ID号为：$$"
echo "当前shell选项为$-"
echo "上一个命令退出的状态为$?"
```

执行结果如下：
```shell
$ sh test.sh param1 "param2 with space"
执行的文件名：test.sh
参数个数为2
第一个参数为：param1
第二个参数为：param2 with space
所有参数为：param1 param2 with space
进程ID号为：3700
当前shell选项为ehB
上一个命令退出的状态为0
```

# 8. 函数
函数定义通过`function_name(){}`的形式定义，函数返回值可以显示用return返回，如果不加，将以最后一条命令的运行结果作为返回值，函数返回值只能是数字。函数也可以传递参数，但是函数定义的()中不需要申明。

编写`shell`脚本如下：

```shell
sayhello(){
    echo "hello"
}

# 注意函数调用只需要函数名，不需要加()
sayhello

sayhellowithparam(){
    echo "hello, $1 $2 $3"
    return 1
}

sayhellowithparam zhangsan lisi wangwu
echo $?
```

输出如下：
> hello
> hello, zhangsan lisi wangwu
> 1

# 9. 命令替换
命令替换可以将一个命令的输出作为另外一个命令的参数。

```shell
# command1 `command2`
cd `pwd` # 该命令将pwd命令列出的目录作为cd命令的参数，结果仍然是停留在当前目录下
cd `echo $HOME` # 将echo的输出作为cd的参数，即打开用户根目录
```

# 10. let命令
let 命令是 BASH 中用于计算的工具，用于执行一个或多个表达式，变量计算中不需要加上 $ 来表示变量。如果表达式中包含了空格或其他特殊字符，则必须引起来。
- 自加操作：`let no++`
- 自减操作：`let no--`
- 简写形式 `let no+=10`，`let no-=20`，分别等同于`let no=no+10`，`let no=no-20`
# 11. 流程控制
## 11.1. if
```shell
if ((10<2));then
    echo "10小于2"
elif ((10>20));then
    echo "a大于10"
else
    echo "10大于2且小于10"
fi
```
## 11.2. case
`case`每一种情况以右括号结尾，执行到`;;`结束

```shell
case 10 in
0|1)
    echo "a为0或1" 
    ;;
11|12) 
    echo "a为11或12"
    ;;
*) 
# *用来匹配所有情况
    echo "a为10" 
    ;;
esac
```

## 11.3. while
```shell
count=0
while(($count<5))
do
    echo $count
    let count++
done
```

## 11.4. util
```shell
count=0
until(($count>=5))
do
    echo $count
    let count++
done
```

## 11.5. for
```shell
# for写法1
for ((count=0;$count<5;count=$count+1))
do
    echo $count
done

# for写法2
arr=(0 1 2 3 4)
for count in ${arr[*]}
do
    echo $int
done

# for写法3
for int in 0 1 2 3 4
do
    echo $int
done
```

## 11.6. break和continue
用法与一般编程语言类似，break跳出循环，continue跳出当前循环
```shell
for ((count=0;$count>=0;count=$count+1))
do
    if (($count>=5));then
        break;
    fi
    echo $count
done
```

# 12. 输入输出重定向
## 12.1. 输出重定向
`command > file`将命令输出结果保存的file文件中。`>`从文件头开始写，会覆盖旧内容，`>>`将内容追加到文件末尾
```shell
# 将who命令的输出保存的users文件中，可以通过cat users查看
who > users 
# 将字符串hello world保存到text.txt文件中
echo "hello world" > text.txt 
```

## 12.2. 输入重定向
`command < file`从file文件获取输入

```shell
wc -l /etc/passwd 
# 123 /etc/passwd
wc -l < users
# 123
# 第一个例子，会输出文件名；第二个不会，因为它仅仅知道从标准输入读取内容

# command < infile > outfile, 同时替换输入和输出，执行command，从文件infile读取内容，然后将输出写入到outfile中。
wc -l < /etc/passwd > result
cat result 
# 123
```

## 12.3. 文件描述符
一般情况下，每个 Unix/Linux 命令运行时都会打开三个文件
- 标准输入文件(stdin)：stdin的文件描述符为0，Unix程序默认从stdin读取数据。
- 标准输出文件(stdout)：stdout 的文件描述符为1，Unix程序默认向stdout输出数据。
- 标准错误文件(stderr)：stderr的文件描述符为2，Unix程序会向stderr流中写入错误信息。

```shell
# 将标准错误输出重定向到error_trace
cat /tmp/fake_file 2>error_trace
cat error_trace
# cat: /tmp/fake_fule: No such file or directory

# 将标准输出和标准错误输出都重定向到result
cat /tmp/fake_file &>result
cat result
# cat: /tmp/fake_fule: No such file or directory

# 将标准错误重定向到标准输出
ls /tmp/fake_file > result 2>&1
cat result
# cat: /tmp/fake_fule: No such file or directory

# 将标准输入重定向到result，将标准错误输出重定向到error_trace
cat /tmp/fake_file 1>result 2>error_trace
```

## 12.4. Here Document
将两个`EOF`之间的内容(document) 作为输入传递给`command`

```bash
# command << EOF
# document
# EOF

cat << EOF
hello
shinerio
learn shell
EOF
```

> 结尾的`EOF`一定要顶格写，前面不能有任何字符，后面也不能有任何字符，包括空格和`tab`缩进。开始的`EOF`前后的空格会被忽略掉。

## 12.5. /dev/null
如果希望执行某个命令，但又不希望在屏幕上显示输出结果，那么可以将输出重定向到 /dev/null。`command > /dev/null`

```shell
cat users > /dev/null
cat users > /dev/null 2>&1
```

# 13. set命令
set指令能设置所使用shell的执行方式，可依照不同的需求来做设置。以下只列出常用的选项参数：
-   -e 　若指令传回值不等于0，则立即退出shell。
-   -f　 取消使用通配符。
-   -n 　只读取指令，而不实际执行。
-   -x 　执行指令后，会先显示该指令及所下的参数。
