# 1. summary
```
用户消息
    ↓
AgentKit 运行时
    ↓
个人助手 Agent
    ├── VeADK Agent (对话引擎)
    ├── ShortTermMemory (短期记忆)
    ├── LongTermMemory (长期记忆)
    ├── KnowledgeBase (个人知识库)
    ├── run_code (代码执行工具)
    ├── mcp_router (MCP工具集)
    └── 火山方舟模型 (LLM)
```
# 2. [knowledge](https://console.volcengine.com/vikingdb/knowledge/region:vdb-knowledge+cn-beijing/collection/list)
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125220751170.png)


```powershell
$env:DATABASE_VIKING_COLLECTION = "知识库名称"
```
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125215848332.png)
# 3. [记忆库](https://console.volcengine.com/vikingdb/memory/region:vdb-memory+cn-beijing/list)
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125220829785.png)

```powershell
$env:DATABASE_VIKINGMEM_COLLECTION = "记忆库名称"
$env:DATABASE_VIKINGMEM_MEMORY_TYPE = "event_v1,event_v11,profile_v1"
```
对话前，无任何相关记忆
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125215136469.png)
通过对话告知喜欢滑雪
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125215102695.png)
再次查询记忆库
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125215243693.png)

# 4. [沙箱工具run_code](https://volcengine.github.io/veadk-python/tools/builtin/)
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125220641625.png)

```
2026-01-25 22:01:26 | DEBUG | run_code.py:55 - tools endpoint: agentkit.cn-beijing.volces.com
2026-01-25 22:01:26 | DEBUG | run_code.py:61 - tool_user_session_id: personal_assistant_user_956eb8eb-3a8f-4b99-a41f-b7b108c13126
2026-01-25 22:01:26 | DEBUG | run_code.py:63 - Running code in language: python3, session_id=956eb8eb-3a8f-4b99-a41f-b7b108c13126, code=# 计算100以内所有偶数的和（包括100）
even_sum = sum(range(0, 101, 2))
print(f"100以内所有偶数的和是: {even_sum}"), tool_id=t-yeeb7eddkw54ppxtz3jy, host=agentkit.cn-beijing.volces.com, service=agentkit, region=cn-beijing, timeout=30
2026-01-25 22:01:33 | DEBUG | run_code.py:112 - Invoke run code response: {'ResponseMetadata': {'RequestId': '02176934967970500000000000000000000ffffac10029576aa85', 'Action': 'InvokeTool', 'Version': '2025-10-30', 'Service': 'agentkit', 'Region': 'cn-beijing'}, 'Result': {'ToolId': 't-yeeb7eddkw54ppxtz3jy', 'UserSessionId': 'personal_assistant_user_956eb8eb-3a8f-4b99-a41f-b7b108c13126', 'SessionId': 's-yeebbsjvuoo2eybtj3cf', 'Endpoint': 'https://sd5r14p17t2mh8bfqo50g.apigateway-cn-beijing.volceapi.com/?faasInstanceName=vefaas-607mxv00-hwmyxaezum-d5r24c034rcr5co4s66g-sandbox', 'InternalEndpoint': '', 'Result': '{\n  "success": true,\n  "message": "Code executed successfully",\n  "data": {\n    "kernel_name": "python3",\n    "session_id": "c53dcb31-c137-43bd-acff-b027ce607a5d",\n    "status": "ok",\n    "execution_count": 1,\n    "outputs": [\n      {\n        "output_type": "stream",\n        "name": "stdout",\n        "text": "100以内所有偶数的和是: 2550\\n",\n        "data": null,\n        "metadata": {},\n        "execution_count": null,\n        "ename": null,\n        "evalue": null,\n        "traceback": null\n      }\n    ],\n    "code": "# 计算100以内所有偶数的和（包括100 ）\\neven_sum = sum(range(0, 101, 2))\\nprint(f\\"100以内所有偶数的和是: {even_sum}\\")",\n    "msg_id": "16142a3c-bebb551941be4c7ba6522472_109_2"\n  }\n}'}}
```
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125220503945.png)
# 5. [mcp&mcp工具集](https://www.volcengine.com/docs/86681/1844857?lang=zh)
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125221514355.png)
部署MCP服务的时候可以选择API KEY自动生成MCP的入站身份鉴权
```json
{
  "mcpServers": {
    "baidu-map": {
      "command": "npx",
      "args": [
        "-y",
        "@baidumap/mcp-server-baidu-map"
      ],
      "env": {
        "BAIDU_MAP_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125225143668.png)

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125225313728.png)
agentkit一直无法拉起mcp工具集，这里使用claude code本地测试
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125233227480.png)

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125233414977.png)

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20260125233623354.png)
```
Based on the information I've gathered using the MCP tools, I've created a comprehensive 1-day walking itinerary for Beijing that connects three major landmarks. Please note that the total walking distance is quite substantial, so I recommend prioritizing the locations most important to you.    

  Morning: Tiananmen Square & Forbidden City (8:00 AM - 12:00 PM)

  Start your journey at Tiananmen Square (天安门广场), the world's largest public square and one of the most iconic sites in Beijing.

  - Address: Beijing Dongcheng District, East Chang'an Street
  - Weather today: Cold, around 0°C with sunny periods. Wear warm clothing.
  - Spend approximately 1-1.5 hours exploring the square and admiring the architecture of the Great Hall of the People and National Museum of China. 

  Then, walk to the Forbidden City (故宫), located just north of Tiananmen Square (about 46 minutes walk covering 3.3 km):
  - Take the route via East Chang'an Street, crossing underpasses and continuing up through the historical district
  - Address: No. 4 Jingshan Front Street, Dongcheng District
  - Opening hours: 8:30 AM - 5:00 PM (last entry at 4:00 PM)
  - Allow 2-3 hours to explore this UNESCO World Heritage site with its imperial palaces and museums

  Afternoon: Temple of Heaven (12:30 PM - 4:00 PM)

  After lunch near the Forbidden City, walk to Temple of Heaven (天坛公园) (about 77 minutes walk covering 5.4 km):
  - Route goes through Qianmen East Street and Qiyang Avenue
  - Address: No. 1 Tiantan East Road, Dongcheng District
  - A beautiful example of traditional Chinese architecture where emperors used to pray for good harvests
  - Opening hours: 6:00 AM - 10:00 PM (park), 8:00 AM - 5:00 PM (attractions)
  - Allow 1.5-2 hours to explore the park and main halls

  Late Afternoon/Evening: Olympic Park - Bird's Nest & Water Cube (4:30 PM - 7:00 PM)

  For the final destination, walk to Olympic Park to see the Bird's Nest (National Stadium) and Water Cube (National Aquatics Center) (about 3 hours walk covering 13.9 km):

  Due to the long walking distance, consider taking public transportation (subway line 5 to Tiantan East Gate, then transfer to line 8 to Olympic Green) for this segment.

  - Address: No. 1 National Stadium South Road, Chaoyang District
  - The Bird's Nest hosted the 2008 Olympics opening and closing ceremonies
  - Water Cube is next door and offers a unique architectural experience
  - Evening lighting makes for excellent photos

  Practical Tips:

  1. Dress warmly: Today's forecast shows temperatures around freezing, with colder wind chill factors.
  2. Comfortable shoes: Bring comfortable walking shoes as you'll cover significant distances.
  3. Transportation backup: Since the third leg of the journey is quite long, have taxi or subway directions ready as alternatives.
  4. Food stops: Pack snacks and plan meals in advance, particularly at the Forbidden City area where there are several restaurants.
  5. Entry tickets: Purchase tickets in advance for the Forbidden City and Temple of Heaven to avoid queues.
  6. Time management: If you're not an avid walker, prioritize 2 out of the 3 sites for a more enjoyable experience.

  This itinerary combines the ancient and modern aspects of Beijing, showcasing imperial history, traditional architecture, and contemporary Olympic legacy sites. Enjoy your Beijing city walk!
```
# 6. 环境变量参考
```shell
AGENTKIT_TOOL_ID=  
DATABASE_VIKINGMEM_COLLECTION= #记忆库名称。
DATABASE_VIKINGMEM_MEMORY_TYPE=  #配置的记忆策略，多个策略使用逗号分隔。
DATABASE_VIKING_COLLECTION= #知识库名称
TOOL_MCP_ROUTER_URL=https://sd598mk9acju1mtc7****.apigateway-cn-beijing.volceapi.com/mcp #MCP工具集的访问域名url。
TOOL_MCP_ROUTER_API_KEY=xxx  #MCP工具集入站身份认证的API Key。
# knowledge、memory、mcp、code_run都是通过公网访问的
# DATABASE_VIKING_BASE_URL="<PrivateLink URL for VPC access only, possibly starts with http://>" #内网访问域名，仅设置内网访问时需要传入。
# 7. DATABASE_VIKINGMEM_BASE_URL="<PrivateLink URL for VPC access only, possibly starts with http://>" #内网访问域名，仅设置内网访问时需要传入。
# DATABASE_VIKINGMEM_PROJECT="default" #非必填，默认为default项目。
```
# 7. 相关链接
- [教程](https://www.volcengine.com/docs/86681/2155817?lang=zh)
- [向量数据库、知识库、记忆库](https://console.volcengine.com/vikingdb/region:vikingdb+cn-beijing/home?)