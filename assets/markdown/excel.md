---
aliases:
  - Excel
---
# 1. 将多个sheet join合并
Power Query自动化合并（适合多列/大数据）
1. **导入数据到Power Query**：
    - 在Excel中点击数据 > Power Query > 获取数据，加载Sheet1和Sheet2。
2. **合并查询**：
    - 选择Sheet1作为主表，与Sheet2按“课程”列进行**左连接（Left Join）**。
3. **展开所有属性**：
    - 在合并后的查询中，展开Sheet2的所有属性列（自动生成N列）。
4. **导出到新工作表**：
    - 点击**加载到Excel**，生成含N列的新表格。