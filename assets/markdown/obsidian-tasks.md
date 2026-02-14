任务管理

# 常用语法

1. 今日之前（包括）已完成，done before <% tp.date.now("YYYY-MM-DD", 1) %> 
2. 本周截止当前日（包括）已完成，done after <% tp.date.weekday("YYYY-MM-DD", 0) %> 
3. 根据重要性排序，sort by priority reverse

# 示例

获取本周所有已经完成的任务，按优先级倒序排列
````text
```tasks
done before <% tp.date.now("YYYY-MM-DD", 1) %> 
done after <% tp.date.weekday("YYYY-MM-DD", 0) %> 
sort by priority reverse
```
````
