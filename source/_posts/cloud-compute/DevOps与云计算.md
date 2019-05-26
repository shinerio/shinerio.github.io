---
title: DevOps与云计算
date: 2019-04-13
categories:
- 云计算
tags:
- 云计算
---



## 云计算

### 概念

- 虚拟化(virtualization)是基础，计算、存储、网络等

- 产品服务化(Iaas, Paas, Saas)      
    - infrastructure  aws, 阿里云，腾讯云
    - platform  面向软件开发者， edas
    - software  面向软件消费者，微信、qq、office

- **重要且必须** 弹性伸缩，没有边界（需要资源的时候可以快速获取，不需要资源的时候能够快速释放）

### 分类

- 公有云

    云服务提供商对基础设施维护，多租户，Pay For Use (像用水用电，简单便宜，共享)

    aws，阿里云，Azure

- 私有云

    自己维护云基础设施，单租户或狭义上的多租户，Pay For Cloud （成本非常高，技术要求高）

    vmware

- 混合云

    云服务提供商维护自己的云设施，硬件是自己的。用户范围内租户隔离，Pay For Use of Cloud

    Azure, BackSpace

## DevOps

### 特征

DevOps = Development + Operations

极速的迭代和快速的用户反馈

### DevOps完整研发周期

Dev->CI/Build->Deploy->Ops->Feedback->Dev

