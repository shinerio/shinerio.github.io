---
title: face recognition based on face++
date: 2016-12-10 12:54:12
categories:
- other
tags:
- c#
- 人工智能
---

# 接入API

本博文旨在帮助读者快速掌握完成基于face++的测试，关于接入这一点就不多说了，百度或者google一下，face++官网都有详细的介绍。

**注意：下面的程序都未进行任何异常处理，任何期望成功的结果都得基于你的正确操作**

# 调用及返回说明

face++采用http api,通过发起http请求，带上合适参数（通常都包含一组api_key和api_secret作为参数，可通过注册开发者账号获得免费受限开发使用权，不同API参数详见官方文档，这里不作具体说明）。返回的正确处理结果通常是Json格式数据，解析Json数据就能得到你想要的结果。

> 本文说明:本文是基于开发者免费账号实现的face recognition，如果想要实现高并发稳定可靠的识别，请移步收费版face++人脸识别sdk

# 本博文使用工具类

```c#
public class HttpHelper
    {
        private static readonly Encoding DEFAULTENCODE = Encoding.UTF8;
        public static HttpWebResponse HttpUploadFile(string url, string[] fileKey,string[] files, NameValueCollection data)
        {
            string boundary = "---------------------------" + DateTime.Now.Ticks.ToString("x");
            byte[] boundarybytes = Encoding.ASCII.GetBytes("\r\n--" + boundary + "\r\n");
            byte[] endbytes = Encoding.ASCII.GetBytes("\r\n--" + boundary + "--\r\n");

            //1.HttpWebRequest
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.ContentType = "multipart/form-data; boundary=" + boundary;
            request.Method = "POST";
            request.KeepAlive = true;
            request.Credentials = CredentialCache.DefaultCredentials;

            using (Stream stream = request.GetRequestStream())
            {
                //1.1 key/value
                string formdataTemplate = "Content-Disposition: form-data; name=\"{0}\"\r\n\r\n{1}";
                if (data != null)
                {
                    foreach (string key in data.Keys)
                    {
                        stream.Write(boundarybytes, 0, boundarybytes.Length);
                        string formitem = string.Format(formdataTemplate, key, data[key]);
                        byte[] formitembytes = DEFAULTENCODE.GetBytes(formitem);
                        stream.Write(formitembytes, 0, formitembytes.Length);
                    }
                }

                //1.2 file
                string headerTemplate = "Content-Disposition: form-data; name=\"{0}\"; filename=\"{1}\"\r\nContent-Type: application/octet-stream\r\n\r\n";
                byte[] buffer = new byte[4096];
                int bytesRead = 0;
                for (int i = 0; i < files.Length; i++)
                {
                    stream.Write(boundarybytes, 0, boundarybytes.Length);
                    string header = string.Format(headerTemplate, fileKey[i], Path.GetFileName(files[i]));
                    byte[] headerbytes = DEFAULTENCODE.GetBytes(header);                    
                    stream.Write(headerbytes, 0, headerbytes.Length);
                    using (FileStream fileStream = new FileStream(files[i], FileMode.Open, FileAccess.Read))
                    {                        
                        while ((bytesRead = fileStream.Read(buffer, 0, buffer.Length)) != 0)
                        {
                            stream.Write(buffer, 0, bytesRead);
                        }
                    }
                }

                //1.3 form end
                stream.Write(endbytes, 0, endbytes.Length);
            }
            //2.WebResponse
            HttpWebResponse response = (HttpWebResponse)request.GetResponse();
            return response;
        }
    }
```

使用说明：

- 参数:

  - String url:face++请求调用的URL
  - String[] filekey:face++请求类型为File的参数名数组，请务必保持与官方文档一致
  - String[] files：本机图片资源地址数据，请注意这个必须与filekey一一对应，保持着两个数组大小一致
  - NameValueCollection data：基本类型数据，通过add的方式添加”参数名—值”键值对，数值类型也请加引号使用字符串代替

- 返回值：

  HttpWebResponse response,通过response可以获得一系列包括错误码或者输出流等信息

# face recognition相关的几个api介绍

## Compare API

官方描述：

将两个人脸进行比对，来判断是否为同一个人。支持传两张图片进行比对，或者一张图片与一个已知的face_token比对，也支持两个face_token进行比对。使用图片进行比对时会选取图片中检测到人脸尺寸最大的一个人脸。

文档链接：<https://console.faceplusplus.com.cn/documents/4887586>

基于此API本人用c#做了一个小的示例demo，代码放在<a href="https://github.com/shinerio/faceDetect">本人github</a>账号上

> 要实现基本的人脸识别功能，需要的功能是将一张图片与图片库资源进行对比，进行识别。
>
> 本文采用**detect->存入 FaceSet->Search**的方式来实现

## Detect API

官方描述：

调用者提供图片文件或者图片URL，进行人脸检测和人脸分析。识别出的人脸会给出face_token，用于后续的人脸比对等操作。请注意，只对人脸包围盒面积最大的5个人脸进行分析，其他人脸可以使用Face Analyze API进行分析。如果您**需要使用检测出的人脸于后续操作，建议将对应face_token添加到FaceSet**中。如果一个face_token连续72小时没有存放在任意FaceSet中，则该face_token将会失效。如果对同一张图片进行多次人脸检测，同一个人脸得到的face_token是不同的。

文档链接：<https://console.faceplusplus.com.cn/documents/4888373>

注意，描述中加重的一句话，我们可以通过用户首次登陆注册，将其对应face_token添加到FaceSet中，这样就为以后的recognition提供了对比来源。

```c#
  HttpWebResponse response = HttpHelper.HttpUploadFile("https://api-cn.faceplusplus.com/facepp/v3/detect", new string[] { "image_file" }, new String[] { fliePath }, data);
```

## FaceSet

### FaceSet Create

官方描述：

 创建一个人脸的集合FaceSet，用于存储人脸标识face_token。一个FaceSet能够存储1,000个face_token。

文档链接：<https://console.faceplusplus.com.cn/documents/4888391>

这里我们最好创建一个outer_i方便记忆操作，使用上述工具时，filekey和files字段置null

```c#
HttpWebResponse response = HttpHelper.HttpUploadFile("https://api-cn.faceplusplus.com/facepp/v3/faceset/create", null, null, data);
```

### FaceSet Add

官方描述：

为一个已经创建的FaceSet添加人脸标识face_token。一个FaceSet最多存储1,000个face_token。

文档链接：https://console.faceplusplus.com.cn/documents/4888389

这里将通过detect获得的face_toke以及FaceSet Create获得的faceset_token，outer_id(二选一)作为参数

```c#
   HttpWebResponse response = HttpHelper.HttpUploadFile(" https://api-cn.faceplusplus.com/facepp/v3/faceset/addface", null, null, data);
```

## Search API

官方描述：

在Faceset中找出与目标人脸最相似的一张或多张人脸。支持传入face_token或者直接传入图片进行人脸搜索。使用图片进行比对时会选取图片中检测到人脸尺寸最大的一个人脸。

文档链接：https://console.faceplusplus.com.cn/documents/4888381

```c#
HttpWebResponse response = HttpHelper.HttpUploadFile("https://api-cn.faceplusplus.com/facepp/v3/search", new string[] { "image_file" }, new String[] { fliePath }, data);
```

到此整个的人脸识别过程就结束了，传入的image会与你face_set中的图片进行对比，从而可以通过thresholds

和confidence字段判断是否认证成功，具体阈值设为多少认为认证成功由各位自行决定。

# 写在最后

本文只简单介绍了下face++的用法，更多详细功能请自行探索

详细代码参考请点击测试代码<a href="https://github.com/shinerio/FaceRecognitionTest">链接</a>，**注意！！！请务必阅读read.me**