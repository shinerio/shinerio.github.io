# 1. 常用运维sql
```sql
# 查询单表实际占用物理空间
select pg_size_pretty(pg_total_relation_size('table_name'));
# 查询单表的最大表页
select max(ctid) from table_name;
```
