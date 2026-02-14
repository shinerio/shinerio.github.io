# 1. 插件安装
C/C++

# 2. 安装gcc
```shell
sudo apt install libc6-dev
sudo apt install build-essential gdb
```

# 3. 配置C++环境
C++环境需要.vscode 文件夹下的以下三个文件共同定义
- **c_cpp_properties.json** ：对C/C++扩展的设置。
- **tasks.json** ：定义如何生成可执行文件。
- **launch.json** ：定义如何调试可执行文件。
## 3.1. tasks.json
tasks.json用于指导vscode如何进行编译。首先选择一个文件夹，右键用vscode 打开，这个文件夹就作为之后写c++的文件夹。如果你这时候在目录下新建一个 `helloworld.cpp` 文件，写好了 `helloworld` 
```
#include<iostream>
#include <limits>
using namespace std;
int main()
{
cout << "helloworld" << endl;
return 0;
}
```
按下 `Ctrl+F5` ，这时会让你选择这个
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241230230650758.png)
选择clang++，会在当前文件夹的 .vscode 文件夹下生成一个`tasks.json`文件
```json
{
    "tasks": [  // 这是一个数组，可以用于定义多个task
        {
            "type": "cppbuild", // 指定任务的类型为cppbuild，这表明该任务用于 C++构建相关操作。
            "label": "C/C++: clang++ 生成活动文件", // 任务的标签，在VS Code的任务列表中显示为C/C++: clang++ 生成活动文件，用于标识该任务。
            "command": "/usr/bin/clang++", // 指定要执行的命令，这里是/usr/bin/clang++，即clang++编译器的路径。这表明该任务将使用clang++来编译 C++ 代码
            "args": [  // 传递给clang++命令的参数数组
                "-fcolor-diagnostics", // 使编译器在输出诊断信息（如错误和警告）时使用颜色编码，使信息更易读。
                "-fansi-escape-codes", // 启用 ANSI 转义码，以便在支持的终端中正确显示颜色编码的诊断信息。
                "-g", // 生成调试信息，这对于在调试器中调试代码非常重要，它允许调试器将机器代码映射回原始的 C++ 源代码。
                "${file}", // 这是一个 VS Code 的变量，代表当前活动的文件，即要编译的 C++ 源文件。
                "-o", // 指定输出文件的选项，其后跟着输出文件的路径。
                "${fileDirname}/${fileBasenameNoExtension}" // 这也是 VS Code的变量组合，${fileDirname}表示当前文件所在的目录，${fileBasenameNoExtension}表示当前文件的文件名（不包含扩展名）。因此，这个组合表示在当前文件所在目录下，生成一个与当前文件名相同但无扩展名的可执行文件。
            ],
            "options": { // 用于设置任务执行时的一些选项
                "cwd": "${fileDirname}" // 指定任务的工作目录，${fileDirname}表示当前文件所在的目录。这意味着编译任务将在当前C++源文件所在的目录中执行
            },
            "problemMatcher": [ // 用于匹配编译器输出中的错误和警告信息，并将其显示在 VS Code 的 “问题” 面板中。`$gcc`是一个预定义的问题匹配器，它适用于 GCC 和 Clang系列编译器的输出格式，能够准确地提取错误信息、位置等。
                "$gcc"
            ],
            "group": { // 定义任务所属的组
                "kind": "build", // 设置为build，表示这是一个构建类型的任务。
                "isDefault": true // 设置为true`，意味着该任务是默认的构建任务。当你在VS Code中触发默认的构建操作（如使用快捷键Ctrl + Shift + B，在 Windows 和 Linux 上；或Cmd + Shift + B，在 macOS 上）时，将执行此任务。
            },
            "detail": "调试器生成的任务。" // 对任务的详细描述，这里是`调试器生成的任务`，表明这个任务配置可能是由 VS Code 的调试器相关功能生成的。
        }
    ],
    "version": "2.0.0" // 指定`tasks.json`文件的版本，这里是`2.0.0`，它有助于 VS Code 理解和正确解析配置文件的结构。
}
```
这段代码定义了 vscode 以怎样的方式调用 gcc 编译器将代码编译成可执行文件。
```shell
/usr/bin/clang++ -std=gnu++14 -fcolor-diagnostics -fansi-escape-codes -g /Users/shinerio/WorkSpace/c_learn/helloworld.cpp -o /Users/shinerio/WorkSpace/c_learn/helloworld
```
如果一切顺利，你应该可以看到文件夹下生成了一个`helloworld`文件。打开终端，输入`./helloworld`，可以发现确实输出了helloworld。
### 3.1.1. 多文件如何进行编译
注意：如果参与编译的cpp文件中存在多个main函数入口，则编译会报错
```shell
/usr/bin/clang++ -fcolor-diagnostics -fansi-escape-codes -g /Users/shinerio/WorkSpace/c_learn/*ns*.cpp -o /Users/shinerio/WorkSpace/c_learn/ns_test
duplicate symbol '_main' in:
    /var/folders/28/4qh3rxdn34x9xtqkj8p6l1vw0000gp/T/m_ns2-96e6ed.o
    /var/folders/28/4qh3rxdn34x9xtqkj8p6l1vw0000gp/T/ns_test-708141.o
ld: 1 duplicate symbol for architecture x86_64
```
![[3. 命名空间#5. 跨多文件]]
## 3.2. launch.json
在 VS Code 中，`launch.json` 文件用于配置调试会话的启动设置。它允许你定义如何启动程序进行调试，包括调试器的类型、要调试的程序路径、传递给程序的参数等重要信息。以下是其具体作用和常见配置项的详细解释。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241230232939792.png)

```json
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0", // 表示`launch.json`文件的版本号，这里是`0.2.0`。VS Code 通过版本号来理解和解析配置文件的结构，不同版本可能支持不同的配置选项或语法。
    "configurations": [ // 是一个数组，包含了一个或多个调试配置。每个配置对象定义了一种特定的调试设置，例如使用不同的调试器、调试不同的程序等。在这个例子中，数组里只有一个调试配置。
        {
            "name": "(lldb) 启动", // 调试配置的名称，在VS Code的调试配置下拉菜单中显示，这里是`(lldb) 启动`。这个名称有助于用户识别和选择特定的调试配置。
            "type": "cppdbg", // 指定调试器的类型，`cppdbg`表示这是用于 C/C++ 调试的调试器。虽然实际使用的调试器是`lldb`，但`cppdbg`是 VS Code 中用于 C/C++ 调试的通用接口类型。
            "request": "launch", // 定义调试会话的类型，`launch`表示该配置用于启动一个新的进程进行调试。与之相对的是`attach`，用于将调试器附加到一个已经在运行的进程
            "program": "${workspaceFolder}/helloworld", // 指定要调试的程序的路径。实际使用时需要将其替换为真实的可执行文件路径。{workspaceFolder}`是VS Code的变量，表示当前工作区的根目录。例如，如果你的可执行文件在工作区的`build`目录下，名为`myApp`，则应将其设置为`${workspaceFolder}/build/myApp`。
            "args": [], // 这是一个数组，用于指定传递给要调试程序的命令行参数。当前配置中数组为空，即不传递任何参数。如果需要传递参数，例如`arg1`和`arg2`，则应写成`["arg1", "arg2"]`。
            "stopAtEntry": false, // 是一个布尔值，决定调试器是否在程序入口处（通常是`main`函数的第一行代码）停止。`false`表示调试器不会在程序入口处自动停止，程序会正常启动，直到遇到设置的断点。如果设置为`true`，程序启动后会立即在入口处暂停，方便你检查初始状态。
            "cwd": "${fileDirname}", // 代表 “current working directory”，即当前工作目录。`${fileDirname}`表示当前打开文件所在的目录。这意味着调试时，程序将以当前打开文件所在的目录作为工作目录。如果你的程序依赖于相对路径来读取文件或加载资源，这个设置会影响程序的行为。
            "environment": [], // 是一个数组，用于设置调试时程序运行的环境变量。当前数组为空，即不额外设置任何环境变量。如果需要设置环境变量，例如设置`PATH`环境变量为`/custom/path:$PATH`，可以写成`[{"name": "PATH", "value": "/custom/path:$PATH"}]`。
            "externalConsole": false, // 是一个布尔值，决定是否在外部控制台中运行调试的程序。`false`表示程序的输入输出将在 VS Code 的集成终端中进行，这样方便在 VS Code 界面内查看程序输出和与程序进行交互。如果设置为`true`，程序将在外部独立的控制台窗口中运行。
            "MIMode": "lldb" // 指定使用的调试器的底层通信协议，`lldb`表示使用 LLDB 调试器。LLDB 是一个高性能的调试器，常用于调试 C、C++ 等语言编写的程序。
        }
    ]
}
```
### 3.2.1. 启动和附加的区别
#### 3.2.1.1. 调试时机与目标程序状态
- **启动（Launch）**：
    - **时机**：在程序尚未运行时使用。它会启动一个新的进程来运行你的 C++ 程序，并同时启动调试器对这个新进程进行调试。
    - **程序状态**：目标程序从初始状态开始执行，就处于调试器的监控之下。例如，你可以在程序的入口点（`main` 函数）设置断点，程序启动后会在断点处暂停，让你可以检查初始状态下的变量、内存等信息。
- **附加（Attach）**：
    - **时机**：用于调试已经在运行的进程。当你希望调试一个正在运行的 C++ 程序，而不是重新启动它时，就可以使用附加调试。
    - **程序状态**：目标程序已经在运行中，可能已经执行了部分代码，处于某个中间状态。例如，一个长时间运行的服务器程序，你发现它在某个特定条件下出现问题，此时不需要重启服务器，而是直接将调试器附加到该运行的进程上进行调试。
#### 3.2.1.2. 应用场景
- **启动（Launch）**：
    - **开发与单步调试**：在开发新功能或调试代码逻辑时非常常用。你可以从程序的开始逐步执行代码，观察变量的变化、函数的调用过程等，以便发现逻辑错误、内存问题等。例如，在实现一个复杂的算法模块时，通过启动调试，在关键代码行设置断点，逐步检查算法的执行是否符合预期。
    - **初始化相关问题调试**：当程序的初始化过程出现问题，如配置文件读取错误、全局变量初始化异常等，使用启动调试可以方便地在初始化阶段就捕获问题。因为程序从启动开始就被调试器监控，能够清晰地看到初始化的每一步。
- **附加（Attach）**：
    - **生产环境或长时间运行程序调试**：在生产环境中，一些服务程序不能随意重启，因为重启可能会影响业务的连续性。此时，如果发现程序出现问题，如内存泄漏、性能瓶颈等，可以将调试器附加到正在运行的服务进程上进行调试。例如，一个在线游戏服务器，不能因为调试问题而随意重启影响玩家体验，这时就可以使用附加调试。
    - **多进程或多线程程序特定进程调试**：对于多进程或多线程的应用程序，当你只想调试其中一个已经启动的特定进程或线程时，附加调试很有用。比如，一个多进程的分布式系统，你关注其中一个负责数据处理的进程，就可以将调试器附加到该进程，而不影响其他进程的运行。
## 3.3. c_cpp_properties.json
在 VS Code 中，`c_cpp_properties.json` 文件主要用于配置 C 和 C++ 扩展的相关属性，它对代码智能感知、语法检查以及与编译器相关的配置等方面起着关键作用。以下是对其作用的详细阐述：
### 3.3.1. 编译器路径配置
- 通过 `compilerPath` 属性，你可以指定项目所使用的 C 或 C++ 编译器的路径。这对于在系统中安装了多个编译器版本，或者编译器不在默认路径的情况非常有用。例如：
```json
{
    "configurations": [
        {
            "name": "Mac",
            "compilerPath": "/usr/bin/clang++",
            // 其他配置项...
        }
    ],
    "version": 4
}
```
在上述配置中，指定了使用位于`/usr/bin`路径下的`clang++`编译器，这确保了 VS Code 的 C/C++ 扩展能够正确调用该编译器来提供相关服务。
### 3.3.2. 包含目录设置
- `includePath` 属性用于指定项目的头文件包含目录。当你在代码中使用`#include`指令时，VS Code 的智能感知功能会依据这些目录来查找头文件。例如，如果你有一个自定义的库，其头文件位于`${workspaceFolder}/include`目录下，你可以这样配置：
```json
{
    "configurations": [
        {
            "name": "Mac",
            "includePath": [
                "${workspaceFolder}/include",
                "/usr/local/include",
                // 其他系统或自定义的包含目录
            ],
            // 其他配置项...
        }
    ],
    "version": 4
}
```
这样，智能感知就能在指定目录中找到所需的头文件，提供准确的代码补全和语法检查。
### 3.3.3. 宏定义设置
- `defines` 属性允许你定义项目中使用的宏。宏定义在预处理阶段发挥作用，影响代码的编译过程。例如，如果你在代码中使用了条件编译，依赖于某个宏是否定义，你可以在`c_cpp_properties.json`中进行定义：
```json
{
    "configurations": [
        {
            "name": "Mac",
            "defines": [
                "DEBUG_MODE",
                "PLATFORM_MAC"
            ],
            // 其他配置项...
        }
    ],
    "version": 4
}
```
上述配置定义了`DEBUG_MODE`和`PLATFORM_MAC`两个宏，在代码中就可以使用`#ifdef`等预处理指令来根据这些宏进行条件编译。
### 3.3.4. 编译器标准指定
- 通过 `cStandard` 和 `cppStandard` 属性，你可以指定代码遵循的 C 或 C++ 语言标准。例如，如果你希望项目遵循 C++17 标准，可以这样配置：
```json
{
    "configurations": [
        {
            "name": "Mac",
            "cppStandard": "c++17",
            // 其他配置项...
        }
    ],
    "version": 4
}
```
这有助于 VS Code 的智能感知和语法检查功能依据指定的标准提供更准确的提示和错误检测。
### 3.3.5. 环境变量设置
- 部分情况下，编译器可能依赖特定的环境变量。你可以在 `c_cpp_properties.json` 中通过 `env` 属性设置环境变量。例如，如果你的编译器需要特定的库路径环境变量，可以这样配置：
```json
{
    "configurations": [
        {
            "name": "Mac",
            "env": {
                "LIBRARY_PATH": "/usr/local/lib"
            },
            // 其他配置项...
        }
    ],
    "version": 4
}
```
这样设置后，在与编译器相关的操作（如智能感知分析等）中，会考虑这些环境变量。
### 3.3.6. 针对不同环境的配置
`c_cpp_properties.json` 支持为不同的环境或构建配置创建多个配置项。例如，你可能在开发过程中有调试和发布两种配置，或者在不同操作系统上有不同的设置。可以通过在 `configurations` 数组中添加多个对象来实现：
```json
{
    "configurations": [
        {
            "name": "Debug",
            "compilerPath": "/usr/bin/g++",
            "defines": [
                "DEBUG"
            ],
            // 其他调试配置相关项...
        },
        {
            "name": "Release",
            "compilerPath": "/usr/bin/g++",
            "defines": [
                "NDEBUG"
            ],
            // 其他发布配置相关项...
        }
    ],
    "version": 4
}
```
通过这种方式，可以方便地针对不同的开发场景进行灵活配置。
### 3.3.7. 配置方法
1. 打开命令面板：在 VS Code 中，按下 Ctrl + Shift + P（Windows/Linux）或 Cmd + Shift + P（Mac）组合键，打开命令面板。
2. 输入并选择命令：在命令面板中输入 “C/C++: Edit Configurations (UI)”，然后从列表中选择该命令。这将打开一个图形化界面用于配置 C/C++ 扩展的属性。
	![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241230234937187.png)
3. 生成并编辑配置：在图形化配置界面中，你可以根据需要设置各种属性，如编译器路径、包含目录、宏定义等。完成设置后，点击 “保存” 按钮，VS Code 会在工作区的 .vscode 文件夹中生成 c_cpp_properties.json 文件，并将你在图形界面中的设置保存到该文件中。
## 3.4. 结语
最终.vscode下会有如下三个文件
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241230235052988.png)

# 4. g++/clang/clang++区别
`g++`、`clang` 和 `clang++` 都是用于编译程序的工具，它们有以下区别：
## 4.1. 所属项目及背景
- **`g++`**：是 GNU 编译器集合（GCC）中的 C++ 编译器。GCC 是 GNU 计划的重要组成部分，具有悠久的历史和广泛的应用。它支持多种编程语言，包括 C、C++、Objective - C、Fortran、Ada 等，并且在开源社区和各种 Linux 发行版中被广泛使用。
- **`clang` 和 `clang++`**：属于 LLVM 项目。LLVM 是一个模块化、可重用的编译器基础架构，以其编译速度快、占用内存少以及优秀的错误提示信息而受到关注。`clang` 主要用于编译C语言程序，`clang++` 则专门用于编译C++程序。
## 4.2. 编译速度
- **`g++`**：在编译大型项目时，由于其采用传统的 GCC 编译架构，编译过程相对较慢，尤其是在处理复杂的模板实例化时，编译时间可能较长。
- **`clang` 和 `clang++`**：基于 LLVM 架构，在编译速度上通常具有优势。LLVM 的设计理念强调编译过程的高效性和并行性，使得 `clang` 和 `clang++` 在编译小型到中型项目时，速度明显快于 `g++`。不过，对于超大型项目，随着优化级别的提高，两者的速度差距可能会缩小。
## 4.3. 内存占用
- **`g++`**：在编译过程中，特别是对于复杂项目，内存占用相对较高。这是因为 GCC 在编译时会构建较为复杂的数据结构来处理语法分析、语义分析等阶段的信息。
- **`clang` 和 `clang++`**：LLVM 的架构设计使得 `clang` 和 `clang++` 在编译过程中的内存占用相对较低。它们采用更轻量级的数据结构和优化的算法来处理编译任务，在内存使用效率方面表现较好。
## 4.4. 错误提示
- **`g++`**：错误提示信息相对较为简洁，但有时可能不够直观，对于新手来说，理解和定位错误原因可能有一定难度。例如，在处理复杂的模板错误时，错误信息可能会非常冗长且难以理解。
- **`clang` 和 `clang++`**：以其友好、详细且易于理解的错误提示信息著称。它们能够更准确地指出错误发生的位置和原因，甚至会提供一些修复建议，这对于开发者，尤其是初学者来说，大大提高了调试效率。
## 4.5. 语言标准支持
- **`g++`**：对 C++ 标准的支持较为全面，随着版本的不断更新，逐渐完善对新 C++ 标准（如 C++11、C++14、C++17、C++20 等）的支持。不过，在某些新特性的支持时间上可能会稍晚于 `clang++`。
- **`clang` 和 `clang++`**：通常能较快地支持新的 C++ 标准特性。由于 LLVM 项目的开发模式和社区活跃度，`clang++` 在对新 C++ 标准的跟进上往往比较及时，能够为开发者提供对最新语言特性的早期支持。
## 4.6. 平台支持
- **`g++`**：广泛支持多种操作系统平台，包括 Linux、Windows（通过 MinGW 等工具）、macOS 等。在 Linux 系统中，它是默认的编译器之一，具有良好的兼容性和稳定性。
- **`clang` 和 `clang++`**：同样支持多种主流操作系统，如 Linux、macOS 和 Windows。在 macOS 系统中，`clang` 和 `clang++` 是默认的编译器，与苹果的开发环境结合紧密。在 Linux 系统上，也逐渐得到广泛应用，尤其在一些追求编译效率的项目中。

# 5. ref
[Using C++ on Linux in VS Code](https://code.visualstudio.com/docs/cpp/config-linux)
