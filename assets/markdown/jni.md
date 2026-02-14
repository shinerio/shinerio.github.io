`System.loadLibrary("native_memory_utils")` 会在`java.library.path`指定的所有目录下查找名为 libnative_memory_utils.so（Linux）或 native_memory_utils.dll（Windows）的文件。
> [!note]
> 在 Linux 下，文件名必须是 libnative_memory_utils.so，不能省略 lib 前缀。
# 1. 编译
定义java方法
```java
public class NativeMemoryUtils {
    static {
        System.loadLibrary("native_memory_utils");
    }

    public static native long allocateAndFillMemory(long size, String fill);
    public static native void freeMemory(long address);
}
```
生成头文件
```shell
javac -h . src/main/java/com/example/demo/NativeMemoryUtils.java
```
编写 native_memory_utils.c
```c
#include <jni.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include "com_example_demo_NativeMemoryUtils.h"

JNIEXPORT jlong JNICALL Java_com_example_demo_NativeMemoryUtils_allocateAndFillMemory
  (JNIEnv *env, jclass clazz, jlong size, jstring fill) {
    const char *fillStr = (*env)->GetStringUTFChars(env, fill, 0);
    size_t fillLen = strlen(fillStr);
    if (fillLen == 0) fillLen = 1;

    char *mem = (char *)malloc((size_t)size);
    if (!mem) {
        (*env)->ReleaseStringUTFChars(env, fill, fillStr);
        return 0;
    }
    for (jlong i = 0; i < size; ++i) {
        mem[i] = fillStr[i % fillLen];
    }
    (*env)->ReleaseStringUTFChars(env, fill, fillStr);
    return (jlong)(intptr_t)mem;
}

JNIEXPORT void JNICALL Java_com_example_demo_NativeMemoryUtils_freeMemory
  (JNIEnv *env, jclass clazz, jlong address) {
    if (address != 0) {
        free((void *)(intptr_t)address);
    }
} 
```
编译为so
```
gcc -fPIC -I${JAVA_HOME}/include -I${JAVA_HOME}/include/linux -shared -o libnative_memory_utils.so native_memory_utils.c
```
# 2. 默认查找路径
- 当前工作目录
- JRE 的 lib 目录
- 环境变量`LD_LIBRARY_PATH`指定的目录
- 启动 JVM 时`-Djava.library.path=`指定的目录
# 3. 匹配逻辑
不要直接写绝对路径，System.loadLibrary 只接受库名，不接受路径。如natvie_memory_utils对应libnative_memory_utils.so
