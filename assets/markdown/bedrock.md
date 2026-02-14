# 1. Model catalog

- Amazon Bedrock Foundation Models
- Amazon Bedrock Marketplace
- Bedrock Custom Model Import

## 1.1. 区别对比

| 特性       | Foundation Models | Marketplace | Custom Model Import |
| -------- | ----------------- | ----------- | ------------------- |
| **模型来源** | AWS 托管的精选模型       | 第三方提供商模型    | 自定义训练/微调模型          |
| **托管方式** | AWS 全托管           | 第三方托管/市场交易  | 自主部署                |
| **成本模式** | 按使用量付费            | 可能需订阅/许可费   | 自带许可成本              |
| **可用性**  | 立即可用，高 SLA        | 依赖提供商       | 自行维护                |
| **定制程度** | 标准模型              | 专业/领域模型     | 完全自定义               |
| **数据隐私** | AWS 标准            | 依赖提供商       | 完全控制                |

### 1.1.1. Foundation Models (基础模型库)
- **定义**: AWS 原生提供、完全托管的精选模型集合
- **特点**:
  - 由 AWS 直接托管和维护，高可用性保证
  - 经过严格测试和优化
  - 按实际使用量付费，无基础设施成本
  - 开箱即用，无需部署
- **模型来源**:
  - Amazon 自研 (Nova, Titan 系列)
  - 顶级 AI 公司 (Anthropic Claude, Meta Llama, Mistral, Cohere)
- **适用场景**: 快速上线、通用任务、成本优化
### 1.1.2. Marketplace (模型市场)
- **定义**: 第三方模型提供商的模型交易平台
- **特点**:
  - 扩展可选模型范围
  - 包含专业领域、特定任务模型
  - 可能需要额外订阅或许可费用
  - 部分模型需要特殊配置
- **模型来源**: 各种 AI 公司、研究机构
- **适用场景**: 特定专业领域、需要最新研究成果
### 1.1.3. Custom Model Import (自定义模型导入)
- **定义**: 导入和部署自己训练或微调的模型
- **特点**:
  - 完全控制模型选择和训练
  - 支持基于开源模型微调/持续预训练
  - 数据完全自主可控
  - 需要处理模型生命周期
- **模型来源**: 自行训练或微调的模型
- **适用场景**:
  - 特定行业知识
  - 数据隐私要求高
  - 需要完全定制化
## 1.2. model choice
### 1.2.1. Amazon Models

| 模型名称 | 参数大小 | 使用场景 |
|---------|---------|---------|
| **Nova Micro** | ~11B | 快速文本生成、对话 |
| **Nova Lite** | ~20B | 多模态理解(文本/图像/视频) |
| **Nova Pro** | ~90B | 多模态复杂推理 |
| **Nova Premier** | ~470B | 最强多模态能力 |
| **Nova Canvas** | - | 图像生成 |
| **Nova Reel** | - | 视频生成 |
| **Nova Sonic** | - | 语音交互 |
| **Titan Text Express** | - | 通用文本生成 |
| **Titan Text Lite** | - | 轻量级文本任务 |
| **Titan Text Premier** | - | 高级文本理解 |
| **Titan Embeddings G1** | - | 文本向量化 |
| **Titan Image Generator** | - | 图像生成 |

### 1.2.2. Anthropic Claude Models

| 模型名称 | 参数大小 | 使用场景 |
|---------|---------|---------|
| **Claude 3 Haiku** | ~20B | 快速响应、简单任务 |
| **Claude 3 Sonnet** | ~70B | 平衡性能与速度 |
| **Claude 3 Opus** | ~2T | 复杂推理、高质量输出 |
| **Claude 3.5 Haiku** | ~20B | 成本优化多模态 |
| **Claude 3.5 Sonnet** | ~70B | 多模态理解与编程 |
| **Claude 3.7 Sonnet** | ~70B | 扩展上下文、复杂任务 |
| **Claude Sonnet 4** | ~70B | 最新平衡型 |
| **Claude Opus 4** | ~2T | 最强推理能力 |
| **Claude Haiku 4.5** | ~20B | 快速响应、简单任务 |
| **Claude Sonnet 4.5** | ~70B+ | 智能体、编程、工具使用 |
| **Claude Opus 4.5** | ~2T+ | 自主推理、规划执行 |

### 1.2.3. Meta Llama Models

| 模型名称                     | 参数大小 | 使用场景      |
| ------------------------ | ---- | --------- |
| **Llama 3 8B**           | 8B   | 轻量级部署     |
| **Llama 3 70B**          | 70B  | 高性能推理     |
| **Llama 3.1 8B**         | 8B   | 优化轻量任务    |
| **Llama 3.1 70B**        | 70B  | 通用高性能     |
| **Llama 3.1 405B**       | 405B | 超大规模推理    |
| **Llama 3.2 1B**         | 1B   | 极速响应、边缘设备 |
| **Llama 3.2 3B**         | 3B   | 轻量级应用     |
| **Llama 3.2 11B**        | 11B  | 多模态视觉理解   |
| **Llama 3.2 90B**        | 90B  | 多模态复杂任务   |
| **Llama 3.3 70B**        | 70B  | 优化推理性能    |
| **Llama 4 Maverick 17B** | 17B  | 多模态智能体    |
| **Llama 4 Scout 17B**    | 17B  | 快速多模态     |

### 1.2.4. Mistral AI Models

| 模型名称 | 参数大小 | 使用场景 |
|---------|---------|---------|
| **Mistral 7B** | 7.3B | 高效开源模型 |
| **Mixtral 8x7B** | 46.7B | MoE架构、高质量输出 |
| **Mistral Small** | 7.3B | 快速响应 |
| **Mistral Large (24.02)** | 123B | 复杂推理 |
| **Mistral Large (24.07)** | 123B | 最新推理能力 |
| **Pixtral Large** | ~123B | 多模态理解 |

### 1.2.5. DeepSeek Models

| 模型名称            | 参数大小         | 使用场景 |
| --------------- | ------------ | ---- |
| **DeepSeek-R1** | 671B (37B激活) | 高级推理 |

### 1.2.6. Google Gemma Models

| 模型名称 | 参数大小 | 使用场景 |
|---------|---------|---------|
| **Gemma 3 270M** | 270M | 文本嵌入 |
| **Gemma 3 1B** | 1B | 轻量级部署 |
| **Gemma 3 4B** | 4B | 平衡性能与速度 |
| **Gemma 3 12B** | 12B | 多模态理解 |
| **Gemma 3 27B** | 27B | 高级推理 |

### 1.2.7. Other Models

| 提供商              | 模型名称                       | 参数大小         | 使用场景     |
| ---------------- | -------------------------- | ------------ | -------- |
| **AI21 Labs**    | Jamba 1.5 Large            | 398B (94B激活) | 长文本处理    |
| **AI21 Labs**    | Jamba 1.5 Mini             | 52B (12B激活)  | 快速生成     |
| **Cohere**       | Command R+                 | 104B         | RAG、工具调用 |
| **Cohere**       | Command R                  | ~35B         | 企业应用     |
| **Cohere**       | Command                    | -            | 通用文本生成   |
| **Cohere**       | Embed English/Multilingual | -            | 向量嵌入     |
| **Cohere**       | Rerank 3.5                 | -            | 搜索重排序    |
| **OpenAI**       | gpt-oss-20b                | 20B          | 代码与推理    |
| **OpenAI**       | gpt-oss-120b               | 120B         | 高级代码分析   |
| **Stability AI** | Stable Diffusion 3.5 Large | -            | 图像生成     |
| **Stability AI** | Stable Image Core/Ultra    | -            | 高质量图像    |
| **Luma AI**      | Ray v2                     | -            | 视频生成     |
| **TwelveLabs**   | Marengo/Pegasus            | -            | 视频理解     |
| **Writer**       | Palmyra X4/X5              | -            | 企业写作     |

# 2. knowledge base(知识向量数据库)
datasource:
- **S3 (Simple Storage Service)**: 对象存储服务
- web crawler
- confluence
- sharePoint
- Custom data sources
# 3. evaluation
被评测模型
评测模型
数据集
评测指标