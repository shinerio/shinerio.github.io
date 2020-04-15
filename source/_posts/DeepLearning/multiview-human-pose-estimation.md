---
title: multiview-human-pose-estimation
date: 2019-10-09
categories: 
- Deep Learning
tags:
- Deep Learning
---

论文题目《Cross View Fusion for 3D Human Pose Estimation》

这篇paper在H36M数据集上，将MPJPE从之前最好的结果52mm直降到26mm，膜拜大佬

<!--more-->

## DataSet

MPII+Human36M

## Innovation

### Cross View Fusion

核心思想是通过单相机无法得知图像中的深度信息，利用多相机多视角（类似于人的两只眼睛），我们就可以得到深度的信息，这个可以用[对极几何](https://zhuanlan.zhihu.com/p/33458436)的知识来求解

网络模型上体现为将同一幅图像的不同视角作为输入，模型先初步获取heatmaps，然后通过fusion layer进行融合得到fused heatmap，对于两部分的heatmap都与gt heatmap进行比较，利用L2 Loss进行监督 

### Recursive Pictorial Structure Model

主要是基于PSM方法，用一个graphical model表示人体，该模型的含有M个变量$J={J_1,J_2,...J_M}$,每一个变量代表一个关节，模型含有17个关节和16条边.

PSM方法因为离散空间导致巨大的量化误差，如果量化过细，会导致复杂度急剧上升，因此作者提出了一种迭代的方式来refine关节点坐标，本质就是一个coarse-to-fine的思想，增加了少量复杂度，提升了算法性能。