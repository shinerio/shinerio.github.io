c++包含两种风格的字符串
- C 风格字符串
- C++ 引入的 string 类类型
# 1. char类型
C风格的字符串起源于C语言，并在C++中继续得到支持。字符串实际上是使用**null**字符\0终止的一维字符数组。因此，一个以null结尾的字符串，包含了组成字符串的字符。
```c++
#include <iostream>
using namespace std;
int main() {
    char site1[7] = {'R', 'U', 'N', 'O', 'O', 'B', '\0'};
    char site2[] = "RUNOOB";
    char site3[8] = "RUNOOB";
    cout << "site1:" << site1 << " ,size:" << sizeof(site1) << endl;
    cout << "site2:" << site2 << " ,site:" << sizeof(site2) << endl;
    cout << "site3:" << site3 << " ,site:" << sizeof(site3) << endl;
    cout << "site1:" << site1 << " ,len:" << strlen(site1) << endl;
    cout << "site2:" << site2 << " ,len:" << strlen(site2) << endl;
    cout << "site3:" << site3 << " ,len:" << strlen(site3) << endl;
}
"""
site1:RUNOOB ,size:7
site2:RUNOOB ,site:7
site3:RUNOOB ,site:8
site1:RUNOOB ,len:6
site2:RUNOOB ,len:6
site3:RUNOOB ,len:6
"""
```
# 2. 字符串函数
| 函数 & 目的                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **strcpy(s1, s2);**  <br>复制字符串 s2 到字符串 s1。                                                                                                               |
| **strcat(s1, s2);**  <br>连接字符串 s2 到字符串 s1 的末尾。连接字符串也可以用 + 号，例如:  <br><br>string str1 = "runoob";<br>string str2 = "google";<br>string str = str1 + str2; |
| **strlen(s1);**  <br>返回字符串 s1 的长度。                                                                                                                       |
| **strcmp(s1, s2);**  <br>如果 s1 和 s2 是相同的，则返回 0；如果 s1<s2 则返回值小于 0；如果 s1>s2 则返回值大于 0。                                                                      |
| **strchr(s1, ch);**  <br>返回一个指针，指向字符串 s1 中字符 ch 的第一次出现的位置。                                                                                               |
| **strstr(s1, s2);**  <br>返回一个指针，指向字符串 s1 中字符串 s2 的第一次出现的位置。                                                                                              |
# 3. string类型
string类型需要添加`#include <string>`
## 3.1. 声明和初始化
```c++
#include <iostream>
#include <string>
using namespace std

int main() {
    // 默认初始化，创建一个空字符串
    string str1; 
    // 使用字符串字面量初始化
    string str2 = "Hello"; 
    // 拷贝初始化
    string str3(str2); 
    // 直接初始化，指定重复次数和字符
    string str4(5, 'A'); 

    std::cout << "str1: " << str1 << std::endl;
    std::cout << "str2: " << str2 << std::endl;
    std::cout << "str3: " << str3 << std::endl;
    std::cout << "str4: " << str4 << std::endl;
    return 0;
}
"""
str1: 
str2: Hello
str3: Hello
str4: AAAAA
"""
```

## 3.2. 字符串操作
### 3.2.1. 字符串拼接
```c++
#include <iostream>
#include <string>

int main() {
    std::string str1 = "Hello";
    std::string str2 = " World";
    // 使用 + 进行拼接
    std::string result1 = str1 + str2; 

    // 使用 += 进行拼接
    str1 += str2; 

    std::cout << "result1: " << result1 << std::endl;
    std::cout << "str1: " << str1 << std::endl;

    return 0;
}
"""
result1: Hello World
str1: Hello World
"""
```
### 3.2.2. 字符串长度
```c++
#include <iostream>
#include <string>
using namespace std;

int main() {
    std::string str = "Hello";
    std::cout << "字符串长度: " << str.size() << std::endl;
    std::cout << "字符串长度: " << str.length() << std::endl;
    return 0;
}
"""
字符串长度: 5
字符串长度: 5
"""
```

### 3.2.3. 访问字符元素
可以使用下标运算符 `[]` 或 `at()` 成员函数访问字符串中的单个字符串元素
```c++
#include <iostream>
#include <string>

int main() {
    std::string str = "Hello";
    // 使用下标运算符访问
    std::cout << "第一个字符: " << str[0] << std::endl; 
    // 使用 at() 函数访问
    std::cout << "第二个字符: " << str.at(1) << std::endl; 
    return 0;
}
"""
第一个字符: H
第二个字符: e
"""
```

### 3.2.4. 字符串比较
可以使用 `"==、!=、<、>"` 等比较运算符进行字符串比较
```c++
#include <iostream>
#include <string>

int main() {
    std::string str1 = "apple";
    std::string str2 = "banana";

    if (str1 < str2) {
        std::cout << str1 << " 在字典序上小于 " << str2 << std::endl;
    }

    return 0;
}
"""
apple 在字典序上小于 banana
"""
```

### 3.2.5. 查找字符串
```c++
#include <iostream>
#include <string>

int main() {
    std::string str = "Hello World";
    size_t pos = str.find("World");
    if (pos != std::string::npos) {
        std::cout << "子字符串 'World' 的位置: " << pos << std::endl;
    } else {
        std::cout << "未找到子字符串" << std::endl;
    }

    return 0;
}
// 子字符串 'World' 的位置: 6
```

### 3.2.6. 截取子字符串
```c++
#include <iostream>
#include <string>

int main() {
    std::string str = "Hello World";
    // 从位置 6 开始截取长度为 5 的子字符串
    std::string subStr = str.substr(6, 5); 
    std::cout << "截取的子字符串: " << subStr << std::endl;

    return 0;
}
// 截取的子字符串: World
```

### 3.2.7. 字符串替换
```c++
#include <iostream>
#include <string>

int main() {
    std::string str = "Hello World";
    // 从位置 6 开始，替换长度为 5 的子字符串为 "Universe"
    str.replace(6, 5, "Universe"); 
    std::cout << "替换后的字符串: " << str << std::endl;

    return 0;
}
// 替换后的字符串: Hello Universe
```

# 4. c和c++风格字符串互转
```c++
#include <iostream>
#include <string>
#include <cstdio>

int main() {
    std::string str = "Hello";
    const char* cStr = str.c_str();
    std::printf("C 风格字符串: %s\n", cStr);
    std::string str2(cStr);
    std::cout << "std::string 对象: " << str2 << std::endl;

    return 0;
}
"""
C 风格字符串: Hello
std::string 对象: Hello
"""
```