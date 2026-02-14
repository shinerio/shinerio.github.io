# 1. 工具推荐
- apifox：rpc客户端，可以导入proto文件，自动生成rpc客户端并重试
# 2. 通信过程
![grpc_protocol_diagram.svg](https://shinerio.oss-cn-beijing.aliyuncs.com/grpc_protocol_diagram.svg)
# 3. 抓包
![](https://shinerio.oss-cn-beijing.aliyuncs.com/20250725232203407.png)
# 4. protocol buffers
Protobuf是Protocol Buffers的简称，它是Google公司开发的一种数据描述语言，用于描述一种轻便高效的结构化数据存储格式。
## 4.1. Varints编码
 普通的int数据类型，无论其值的大小，所占用的存储空间都是相等的。⽐如不管是0x12345678还是0x12都占⽤4字节，那能否让0x12在表示的时候只占⽤1个字节呢？是否可以根据数值的⼤⼩来动态地占⽤存储空间, 使得值⽐较⼩的数字占⽤较少的字节数, 值相对⽐较⼤的数字占⽤较多的字节数, 这即是变⻓整型编码的基本思想。
 
 Varints编码采⽤变⻓整型编码的数字，其占⽤的字节数不是完全⼀致的
 - 每个字节的最⾼有效位（Most Significant Bit, MSB）作为标志位，当最⾼有效位为1时，代表其后还跟有字节，当最⾼有效位为0时，代表已经是该数字的最后的⼀个字节
 - 剩余的7位以⼆进制补码的形式来存储数字值本身

在 Protobuf 中, 使⽤的是Base128 Varints编码, 在这种⽅式中, 使⽤7bit （即7的2次⽅为128） 来存储数字，在 Protobuf中, Base128 Varints采⽤的是⼩端序（即数字的低位存放在⾼地址）。  

1. 对于数字1，假设int类型占4个字节, 以标准的整型存储, 其⼆进制表示应为：
```text
00000000 00000000 00000000 00000001
```
可⻅，只有最后⼀个字节存储了有效数值, 前3个字节都是 0, 若采⽤Varints编码, 其⼆进制形式为：
```text
00000001
```
因为其没有后续字节，因此其最⾼有效位为0，其余的7位以补码形式存放1。
# 5. .proto文件
porto文件在客户端和服务器端是共用的
```conf
syntax = "proto3";

package sum;

// 导入其他proto文件 
import "google/protobuf/timestamp.proto"; 
import "google/protobuf/any.proto";

// SumService provides arithmetic operations
service SumService {
  // AddNumbers adds two integers and returns the result
  rpc AddNumbers(AddRequest) returns (AddResponse);
  
  // SubtractNumbers subtracts num2 from num1 and returns the result
  rpc SubtractNumbers(SubtractRequest) returns (SubtractResponse);
}

// AddRequest contains the two numbers to be added
message AddRequest {
  int32 num1 = 1;  // First number
  int32 num2 = 2;  // Second number
}

// AddResponse contains the result of the addition
message AddResponse {
  int32 result = 1;  // Sum of num1 and num2
}

// SubtractRequest contains the two numbers for subtraction
message SubtractRequest {
  int32 num1 = 1;  // First number (minuend)
  int32 num2 = 2;  // Second number (subtrahend)
}

// SubtractResponse contains the result of the subtraction
message SubtractResponse {
  int32 result = 1;  // Difference of num1 - num2
}
```
## 5.1. syntax
指定了使用`proto3`语法。如果省略，protocol buffer编译器默认使用 `proto2`语法
## 5.2. package
`.proto`文件中添加一个可选的`package`符来防止消息类型之前的名称冲突。
## 5.3. import
可以导入其他proto文件定义
## 5.4. service
一个package下可以有多个service，每个service可以有多个method，method定义的格式为`rpv methodName(RequestModel) returns ResponseModel`
## 5.5. message
基本格式为`message MessageName { type field_name = field_number; }`
字段编号规则：
- 必须是正整数
- 在同一个message中必须唯一
- 1-15: 使用1字节编码（推荐用于常用字段）
- 16-2047: 使用2字节编码
- 最大值: 2^29 - 1 (536,870,911)
```
message FieldNumberExample {
 // 定义嵌套的message
  message Address {
    string street = 1;
    string city = 2;
    string state = 3;
    string zip_code = 4;
    string country = 5;
  }
  
  string frequent_field = 1;    // 推荐：常用字段使用1-15
  string another_field = 2;
  string less_used_field = 16;  // 不常用字段可以使用更大编号
  
  // 保留字段编号（避免将来冲突）
  reserved 3, 5, 9 to 11;       // 保留特定编号
  reserved "old_field_name";     // 保留字段名
}

```