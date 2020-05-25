---
title: Redis源码解析——总览
date: 2020-05-13
categories:
- C/C++
tags:
- Redis
- C/C++
---

Redis全称Remote Dictionary Server，是一个高性能的key-value存储系统。Redis支持的数据结构有string/list/set/zset/hash。Redis支持数据持久化，可以将内存中的数据保存在磁盘中，重启时可以再次加载进行使用。Redis还支持通过master-slae模式进行数据备份。本文主要针对Redis3.0版本的源码进行解读。

<!--more-->

## 1. 内存管理

redis内存管理主要由zmalloc.h和zmalloc.c实现

## 2. 数据结构

## 3. 服务框架

## 4. 日志与断言

## 5. 机制与策略





