---
title: Shell脚本编程
date: 2020-05-12
categories:
- Linux
tags:
- Linux

---

## 1. 变量

### 1.1 变量定义

使用`VARIABLENAME=VALUE`的形式，VALUE如果是字符串的话，可以使用单引号、双引号或者不加引号。单引号内的任何字符都会原样输出，不能进行转义，单引号内不能单独出现一个单引号，但可成对出现，作为字符串拼接使用。双引号可以有变量，双引号内可以出现转义字符。

### 1.2 变量使用

只需要在变量前加$符号，变量加{}是可选的，方便解释器识别边界。将变量加上{}是一个好习惯，不容易出错。

```bash
your_age=25
your_name="shinerio"
your_name=shinerio
your_name='shinerio'  
echo $your_age   # 输出25
echo $your_name   # 输出shinerio
echo "${your_name}hello" #这里{}必须添加，否则解释器认为是${your_namehello}
str='hello'' # 非法
str='hello'__'world'  # 成对出现的单引号做字符拼接
echo $str #输出hello__world
str1='helloworld${your_age}\nnew line'
str2="helloworld${your_age}\nnew line"
echo $str1  # 输出helloworld${your_age}\nnew line
echo $str2  # 输出helloworld25\nnew line
#输出
#helloworld25 
#new line
echo -e $str2   # -e开启转义  \n表示换行  echo默认换行，通过\c强制不换行
```

### 1.3 只读变量

使用`readonly VARIABLENAME`设置变量只读，只读变量的值不能更改

### 1.4 删除变量

使用`unset VARIABLENAME` `删除变量。

```bash
readonly your_age # 设置your_age只读
unset your_age # 删除变量your_age
```

### 1.5 字符串操作

- 字符串拼接
- 获取字符串长度`${#VARIABLENAME}`
- 截取子字符串`${VARIABLENAME:a:b}`，从第a个开始（包含），共截取b个字符，第一个字符索引为0

```bash
# 以下三种方式等价
str4="hello"${your_name}"world"
str5="hello${your_name}world"
str5='hello'${your_name}'world'

str='hello'
echo ${#str}  #输出5
echo ${str:1:2} #输出tr
```

### 1.6 数组

Bash Shell只支持一维数组，用括号表示，元素通过空格分隔，形如`数组名=(值1 值2 ... 值n)`，读取数组元素名`${数组名[下标]}`，使用@或\*代替下标，获取数组中所有元素。使用`{#数组名[@]}`或`{#数组名[*]}`获取数组元素个数。

```bash
arr=(value0 value1 value2 value3)
arr[3]=value33
echo ${arr[3]}  #value33
echo ${arr[*]}  #value0 value1 value2 value33
length=${#arr[@]} 
echo ${length}  #4
echo "arr[3]的长度为:${#arr[3]}"  #arr[3]的长度为:7
```

## 2. 注释

```bash
# 这是单行注释
:>>EOF
多行注释内容
多行注释内容
多行注释内容
EOF
# 多行注释EOF也可替换成!或'
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

## 3. 运算符

### 3.1 算数运算符

算数运算符有如下五种写法，其中使用expr的表示方法时，表达式和运算符之间必须有空格。支持加法+,减法-,乘法\*,除法/,取余%,赋值=,相等==,不等!=

```bash
a=10
b=20
c=`expr ${a} + ${b}`  # 必须有空格，`expr ${a}+${b}`这种写法是错的 
echo $c      #30
c=$[a+b]
echo $c    #30
c=$[${a}*${b}]         # 使用expr做乘法运算时，需要用\*转移，即c=`expr ${a} \* ${c}`
echo $c       #200
c=$(expr ${a} / ${b})  
echo $c         #结果为10，向下取整
c=$(($a%$b))  # 这里必须是两个小括号
echo $c       #10
if [ $a == $b ]
then
   echo "a 等于 b"
fi
if [ $a != $b ]
then
   echo "a 不等于 b"    #输出  a 不等于 b
fi
```

### 3.2 关系、布尔、逻辑运算符

关系、布尔和逻辑运算必须在条件表达式（if、while）下，类似`flag=[ $a -eq $b ] `的直接赋值语句是非法的。关系和布尔运算的条件表达式要放在一对方括号中，并且中间需要有空格，逻辑运算的条件表达式要放在两对方括号中。

下列假定变量 a 为 10，变量 b 为 20：

| 运算符 | 说明                                                  | 举例                         |
| :----- | :---------------------------------------------------- | :--------------------------- |
| -eq    | 检测两个数是否相等，相等返回 true。                   | [ \$a -eq ​\$b ] 返回 false。 |
| -ne    | 检测两个数是否不相等，不相等返回 true。               | [ \$a -ne ​\$b ] 返回 true。  |
| -gt    | 检测左边的数是否大于右边的，如果是，则返回 true。     | [ \$a -gt \$b ] 返回 false。  |
| -lt    | 检测左边的数是否小于右边的，如果是，则返回 true。     | [ \$a -lt \$b ] 返回 true。   |
| -ge    | 检测左边的数是否大于等于右边的，如果是，则返回 true。 | [ \$a -ge \$b ] 返回 false。   |
| -le    | 检测左边的数是否小于等于右边的，如果是，则返回 true。 | [ \$a -le \$b ] 返回 true。    |

| 运算符 | 说明                      | 举例  |
| :----- | :-------------------------------------------------- | :--------------------------------------- |
| !      | 非运算，表达式为 true 则返回 false，否则返回 true。 | [ ! false ] 返回 true。                  |
| -o     | 或运算，有一个表达式为 true 则返回 true。           | [ \$a -lt 20 -o \$b -gt 100 ] 返回 true。  |
| -a     | 与运算，两个表达式都为 true 才返回 true。           | [ \$a -lt 20 -a \$b -gt 100 ] 返回 false。 |

```bash
a=10
b=20
if [ $a -eq $b ] # 类似[$a -eq $b]缺少空格是非法的
then
   echo "$a -eq $b : a 等于 b"
else
   echo "$a -eq $b: a 不等于 b"
fi
if [[ $a -lt 100 && $b -gt 100 ]]
then
   echo "返回 true"
else
   echo "返回 false"
fi
# 使用(())替换[]和[[]]
if (($a == $b))
then
   echo "$a -eq $b : a 等于 b"
else
   echo "$a -eq $b: a 不等于 b"
fi
if (($a < 100 && $b > 100))
then
   echo "返回 true"
else
   echo "返回 false"
fi	
```

!!! warning ""
    可以使用(())替代[]和[[]]，此时-eq,-lt,-le之类的需要使用==,<,<=等替换。

### 3.3 字符串运算符

假定变量 a 为 "abc"，变量 b 为 "dsef"：

| 运算符 | 说明                                         | 举例                     |
| :----- | :------------------------------------------- | :----------------------- |
| =      | 检测两个字符串是否相等，相等返回 true。      | [ \$a = \$b ] 返回 false。 |
| !=     | 检测两个字符串是否相等，不相等返回 true。    | [ \$a != \$b ] 返回 true。 |
| -z     | 检测字符串长度是否为0，为0返回 true。        | [ -z \$a ] 返回 false。   |
| -n     | 检测字符串长度是否不为 0，不为 0 返回 true。 | [ -n "\$a" ] 返回 true。  |
| \$      | 检测字符串是否为空，不为空返回 true。        | [ \$a ] 返回 true。       |

```bash
a="abc"
b="dsef"
if [ $a == $b ]
then
   echo "a等于b"
else
   echo "a不等于b"
fi
if [ -z $a ]
then
   echo "-z $a : 字符串长度为 0"
else
   echo "-z $a : 字符串长度不为 0"
fi
if [ -n "$a" ]   # 这里$a需要加引号，否则恒为true
then
   echo "-z $a : 字符串长度不为 0"
else
   echo "-z $a : 字符串长度为 0"
fi
```

!!! warning ""
    字符串运算时，不可以使用(())替代[]和[[]]。-n和\$区别在于，" "空白字符串对于-n而言返回true，而对于\$返回false

### 3.4 文件测试运算符

| 操作符  | 说明                                                         | 举例                      |
| :------ | :----------------------------------------------------------- | :------------------------ |
| -b file | 检测文件是否是块设备文件，如果是，则返回 true。              | [ -b \$file ] 返回 false。 |
| -c file | 检测文件是否是字符设备文件，如果是，则返回 true。            | [ -c \$file ] 返回 false。 |
| -d file | 检测文件是否是目录，如果是，则返回 true。                    | [ -d \$file ] 返回 false。 |
| -f file | 检测文件是否是普通文件（既不是目录，也不是设备文件），如果是，则返回 true。 | [ -f \$file ] 返回 true。  |
| -g file | 检测文件是否设置了 SGID 位，如果是，则返回 true。            | [ -g \$file ] 返回 false。 |
| -k file | 检测文件是否设置了粘着位(Sticky Bit)，如果是，则返回 true。  | [ -k \$file ] 返回 false。 |
| -p file | 检测文件是否是有名管道，如果是，则返回 true。                | [ -p \$file ] 返回 false。 |
| -u file | 检测文件是否设置了 SUID 位，如果是，则返回 true。            | [ -u \$file ] 返回 false。 |
| -r file | 检测文件是否可读，如果是，则返回 true。                      | [ -r \$file ] 返回 true。  |
| -w file | 检测文件是否可写，如果是，则返回 true。                      | [ -w \$file ] 返回 true。  |
| -x file | 检测文件是否可执行，如果是，则返回 true。                    | [ -x \$file ] 返回 true。  |
| -s file | 检测文件是否为空（文件大小是否大于0），不为空返回 true。     | [ -s \$file ] 返回 true。  |
| -e file | 检测文件（包括目录）是否存在，如果是，则返回 true。          | [ -e \$file ] 返回 true。  |

```bash
file="/etc/profile"
if [ -e $file ]
then
   echo "文件存在"
else
   echo "文件不存在"
fi
```

## 4. 传递参数

我们可以在执行 Shell 脚本时，向脚本传递参数，脚本内获取参数的格式为：\$n。n代表一个数字，1 为执行脚本的第一个参数，2 为执行脚本的第二个参数，\$0为执行的文件名。在为shell脚本传递的参数中如果包含空格，应该使用单引号或者双引号将该参数括起来，以便于脚本将这个参数作为整体来接收。另外，还有几个特殊字符用来处理参数：

| 参数处理 | 说明                                                         |
| :------- | :----------------------------------------------------------- |
| \$#       | 传递到脚本的参数个数                                         |
| \$\*       | 以一个单字符串显示所有向脚本传递的参数。 如"\$\*"用「"」括起来的情况、以"\$1 \$2 … \$n"的形式输出所有参数。 |
| \$\$       | 脚本运行的当前进程ID号                                       |
| \$!       | 后台运行的最后一个进程的ID号                                 |
| \$@       | 与$*相同，但是使用时加引号，并在引号中返回每个参数，以"\$1" "\$2" … "\$n" 的形式输出所有参数。 |
| \$-       | 显示Shell使用的当前选项，与set功能相同。 |
| \$?       | 显示最后命令的退出状态。0表示没有错误，其他任何值表明有错误。 |

```bash
echo "执行的文件名：$0";
echo "第一个参数为：$1";
echo "第二个参数为：$2";
echo "第三个参数为：$3";
```

<details>
<summary>./test.sh par1 par2 "par3 包含空格"</summary>
<pre>
执行的文件名：./test.sh
第一个参数为：par1
第二个参数为：par2
第三个参数为：par3 包含空格
</pre>
</details>

## 5. 函数

函数定义通过`FUNCTIONNAME (){}`的形式定义，函数返回值可以显示用return返回，如果不加，将以最后一条命令的运行结果作为返回值，函数返回值只能是数字。函数也可以传递参数，但是函数定义的()中不需要申明。

```bash
sayHello(){
    echo "hello"
}
sayHello # 注意函数调用只需要函数名，不需要加()
sayHello2(){
    echo "hello, $1 $2 $3"
    return 1
}
sayHello2 zhangsan lisi wangwu
echo $?
```

<details>
<summary>输出</summary>
<pre>
hello
hello, zhangsan lisi wangwu
1
</pre>
</details>

## 6. 命令替换

命令替换可以将一个命令的输出作为另外一个命令的参数。

```bash
# command1 `command2`
cd `pwd` # 该命令将pwd命令列出的目录作为cd命令的参数，结果仍然是停留在当前目录下
cd `echo $HOME` # 将echo的输出作为cd的参数，即打开用户根目录
```


## 7. echo和printf

echo可以用来输出一个变量，也可以用来显示命令结果，echo命令会自动换行

```bash
your_name=shinerio
echo $your_name
echo "shinerio" 
echo `ls`  # 输出ls结果
echo `cat test.sh` # 输出test.sh文本内容
```

printf模仿的是C中的printf，可以用来格式化字符串，语法`printf format-string [arguments] `，printf不会自动换行需要使用转移字符\n

```bash
your_name=shinerio
printf "shinerio\n"
printf "hello${your_name}\n"
printf "hello%s\n" ${your_name}
```

<details>
<summary>输出</summary>
<pre>
shinerio
helloshinerio
helloshinerio
</pre>
</details>

## 8. 流程控制

### 8.1 if

```bash
a=10
if (($a<2))
then
    echo "a小于2"
elif (($a>10))
then
    echo "a大于10"
else
    echo "a大于等2且小于等于10"
fi
# a大于等2且小于等于10
```

### 8.2 case

```bash
a=10
case $a in
  0|1) echo "a为0或1"    #每一种情况以右括号结尾，执行到;;结束
  ;;
  11|12) echo "a为11或12"
  ;;
  *) echo "a为$a"    # *用来匹配所有情况
  ;;
esac
```

### 8.3 while

```bash
int=0
while(($int<5))
do
    echo $int
    let "int++"
done
```

### 8.4 util

```bash
int=0
until(($int>=5))
do
    echo $int
    let "int++"
done
```

### 8.5 for

```bash
# for写法1
for ((int=0;$int<5;int=$int+1))
do
    echo $int
done
# for写法2
arr=(0 1 2 3 4)
for int in ${arr[*]}
do
    echo $int
done
# for写法3
for int in 0 1 2 3 4
do
    echo $int
done
```

### 8.6 break和continue

用法与一般编程语言类似，break跳出循环，continue跳出当前循环

## 9. 输入/输出重定向

### 9.1 输出重定向

```bash
# command > file 将命令输出结果保存的file文件中
who > users # 将who命令的输出保存的users文件中，可以通过cat users查看
echo "hello world" > text.txt # 将字符串保存到text.txt文件中
```

<details>
<summary>cat users</summary>
<pre>
zhangrui console  Apr 27 18:11
zhangrui ttys000  May 12 20:34
</pre>
</details>

!!! note "\>和\>\>"
    \>从文件头开始写，会覆盖旧内容，\>\>将内容追加到文件末尾

### 9.2 输出重定向

```bash
# command < file 从file文件获取输入
wc -l users   # 2 users
wc -l < users # 2
# 第一个例子，会输出文件名；第二个不会，因为它仅仅知道从标准输入读取内容
# command < infile > outfile, 同时替换输入和输出，执行command，从文件infile读取内容，然后将输出写入到outfile中。
wc -l < users > result
cat result # 内容为2
```

### 9.3 文件描述符

一般情况下，每个 Unix/Linux 命令运行时都会打开三个文件

- 标准输入文件(stdin)：stdin的文件描述符为0，Unix程序默认从stdin读取数据。
- 标准输出文件(stdout)：stdout 的文件描述符为1，Unix程序默认向stdout输出数据。
- 标准错误文件(stderr)：stderr的文件描述符为2，Unix程序会向stderr流中写入错误信息。

默认情况下，command > file 将 stdout 重定向到 file，command < file 将stdin 重定向到 file。

如果想把stderr重定向到errorfile，可以使用

```bash
ls /etc/unexist >file 2> errorfile  # 错误输出到errorfile
cat file   # 无输出
cat errorfile # ls: /etc/unexist: No such file or directory
ls /etc/unexist &>file  # 将标准输出和标准错误输出都重定向到file
cat file # ls: /etc/unexist: No such file or directory
ls /etc/unexist > file 2>&1 # 将标准错误重定向到标准输出
cat file # ls: /etc/unexist: No such file or directory
```

### 9.4 Here Document

```bash
# command << EOF
#    document
# EOF
# 将两个 EOF 之间的内容(document) 作为输入传递给 command
cat << EOF
hello
shinerio
LearnShell
EOF

```

<details>
<summary>输出</summary>
<pre>
hello
shinerio
LearnShell
</pre>
</details>

!!! warning ""
    结尾的EOF 一定要顶格写，前面不能有任何字符，后面也不能有任何字符，包括空格和 tab 缩进。开始的EOF前后的空格会被忽略掉。

### 9.5 /dev/null

如果希望执行某个命令，但又不希望在屏幕上显示输出结果，那么可以将输出重定向到 /dev/null。

```bash
#  command > /dev/null
cat users > /dev/null
cat users > /dev/null 2>&1
```

## 9. 文件包含

使用`. 文件名`的格式包含外部脚本文件。

head.sh

```bash
your_name=shinerio
```

test.sh

```bash
. ./head.sh
echo $your_name #输出shinerio
```

