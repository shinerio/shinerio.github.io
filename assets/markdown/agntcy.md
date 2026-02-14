# 1. OASF
Open Agentic Schema Framework一个基于OCI(Open Container Initiative)的可扩展数据模型，用于描述agent的属性并确保agent的唯一标识。OASF支持描述A2A代理和MCP服务器，并且可以扩展以支持其他常用格式，例如Copilot代理清单等等。

OASF 的核心是“智能体记录”（[Agent Record](https://github.com/agntcy/oasf/blob/main/schema/objects/record.json)），这是一个标准化的JSON对象，作为智能体在网络中的数字化身。一个典型的 OASF 记录包含以下关键字段

| **字段 (Field)**                                                      | **类型** | **描述与作用**                                                    | **洞察**                                     |
| ------------------------------------------------------------------- | ------ | ------------------------------------------------------------ | ------------------------------------------ |
| `metadata`                                                          | Object | 包含名称、版本、作者、描述等基本信息。                                          | 用于人类可读的展示和基本的版本管理。                         |
| [skills](https://schema.oasf.outshift.com/0.8.0/skill_categories)   | Array  | 代理能够执行的具体能力或功能，如 `images_computer_vision/image_segmentation` | **核心路由依据**。发现机制基于此字段将抽象需求映射到具体记录。          |
| [domains](https://schema.oasf.outshift.com/0.8.0/domain_categories) | Array  | 用于描述 AI 代理所擅长的领域(domains)，如`technology/network_operations`   |                                            |
| `locators`                                                          | Array  | 定义智能体的访问入口（如 Docker镜像地址、API URL、源码库）。                        | 将元数据链接到实体的物理存在。支持多种协议（HTTP, SLIM, Docker）。 |
| `modules`                                                           | Array  | 扩展字段，用于定义输入/输出 Schema、定价模型、合规性声明等。                           | 提供了极强的扩展性，允许在不破坏标准结构的前提下增加业务特定逻辑。          |

## 1.1. [skills & domains](https://docs.agntcy.org/oasf/agent-record-guide/#basic-information)
两者都使用分层命名(如 `category/subcategory/specific`)，但:
- **Skill**: 按**能力类型**分类 (如 `自然语言处理 → 生成 → 文本补全`)
- **Domain**: 按**行业领域**分类 (如 `技术 → 网络运维`)
客户端可以通过综合skills、domains进行多维度查询以实现精确选择。
- **Skill**回答: 这个代理能执行什么功能?
- **Domain**回答: 这个代理在哪个行业/场景下最有效?
- **组合查询**: "找一个具有临床总结能力(skill)并专注于医疗合规(domain)的代理"
假设查询:**"找一个能生成报告且懂网络安全的代理"**，这样既确保代理有**生成报告的能力**(skill),又确保它**理解网络安全领域的专业知识**(domain)。
```json
{
  "skills": ["natural_language_generation/report_generation"],
  "domains": ["cybersecurity/threat_analysis"]
}
```
## 1.2. directory server
skill和domain这种分层命名的数据非常适合使用目录服务器存储
```
natural_language_generation
├── report_generation
├── analyze_video
```
# 2. Agent Directory
允许发布和发现使用OASF描述的代理或多代理应用程序。任何组织都可以运行自己的目录并与其他组织保持同步，从而形成代理互联网清单。代理目录支持A2A agent cards和MCP server描述等数据模型。

- **Records**: ADS中的基本单元和基本信息，表示独立的agents和它们的能力。每一个record都是唯一的，包含描述agent skills,attributes和constrainsts的元数据
- **Distributed Hash Table (DHT)**: 一个可以高效查找和提取record目录的分布式存储系统，该分布式哈希表（DHT）将agent skill与record identifier建立映射，可基于agent的能力实现快速发现相关agent
- **Content Routing Protocol**: 一套用于在Agent与目录服务器之间路由请求和响应的规则与机制。该协议确保对Agent能力的查询能被高效地定向到托管相关记录的对应服务器。
- **Agent Directory Servers**: ADS 网络中负责存储和管理目录记录的节点。这些服务器参与分布式哈希表（DHT）并实现内容路由协议，以助力代理发现。
- **Clients**: 允许开发人员与ADS交互、发布Agent record以及基于特定条件搜索Agent的工具。
- **Security and Trust Mechanisms**: 用于确保目录记录与节点的完整性及真实性的功能特性，包括密码学签名、声明验证、安全通信协议以及访问控制。


AGNTCY的Agent Directory Service (ADS) 重用成熟的OCI/ORAS基础设施来进行工件分发 [arXiv](https://arxiv.org/pdf/2509.18787),这样做的好处包括:
1. **持久性和互操作性** - OCI 注册表语义提供了经过验证的存储和索引基础
2. **内容寻址** - 支持加密完整性和可验证性
3. **标准化** - 利用容器生态系统中广泛采用的成熟标准
4. **分布式存储** - 代理记录和相关引用作为 OCI 工件存储在一个或多个注册表中

https://claude.ai/share/0cc4cb76-c63d-44de-ac65-4ac5326921e3

# 3. messaging SDK
- **SLIM**（ecure Low-latency Interactive Messaging）：一种协议，它定义了Ai Agent之间安全高效的网络级通信的标准和指南。SLIM通过指定消息格式、传输机制和交互模式，确保互操作性和无缝的数据交换。
- **SLIM Node and SDK**：通过SDK/库为一组Agent（通常是给定多Agent的应用程序）提供便捷、安全（MLS 和量子安全）的网络级通信服务。它扩展了gRPC，除了请求/响应、流式传输、即发即弃等功能外，还支持发布/订阅等。

简单来说,Agntcy 借用了容器技术中的 OCI 标准来存储和分发 AI 代理的元数据和配置信息,这使得代理的发现、验证和分发更加标准化和可靠。