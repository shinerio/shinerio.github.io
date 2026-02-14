# 1. golps
golps 是LSP(Language Server Protocol)的一个语言端（Server）实现，是针对 Go 语言的LSP实现。定义了在编辑器或IDE中与语言服务器之间使用的协议，该语言服务器提供诸如自动完成，转到定义，查找所有引用等语言功能。语言服务器索引格式（LSIF，其发音类似于“ else if”）的目标是支持开发工具或Web UI中的富代码导航，而不需要源代码的本地副本。
1. 自动代码补全：根据当前输入的内容，自动生成可能的选项供用户选择。
2. 自动导航：根据用户光标位置，显示可以跳转的函数、变量定义位置。
3. 代码重构：可以快速从已有的代码块中进行抽取函数、变量声明提取等操作。
4. 代码格式化：自动调整代码的缩进、空格、回车等格式。
5. 语法检查：检查代码是否符合Go语言规范，并提示可能的错误。
6. 错误提示：当代码中存在错误时，快速向用户反馈错误信息并给出解决方案。
7. 自动生成代码：能够自动生成一些常见的代码，如函数、结构体等。
# 2. gotests
该工具可以自动生成针对Go代码中函数的[单元测试](https://zhida.zhihu.com/search?content_id=225380939&content_type=Article&match_order=1&q=%E5%8D%95%E5%85%83%E6%B5%8B%E8%AF%95&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDA4NDU4MzEsInEiOiLljZXlhYPmtYvor5UiLCJ6aGlkYV9zb3VyY2UiOiJlbnRpdHkiLCJjb250ZW50X2lkIjoyMjUzODA5MzksImNvbnRlbnRfdHlwZSI6IkFydGljbGUiLCJtYXRjaF9vcmRlciI6MSwiemRfdG9rZW4iOm51bGx9.QHDWw_7hFmTi_feftEbN8DM64Y-nMCM_zG3hRDvAYT8&zhida_source=entity)代码。可以极大地提高我们的开发效率和[代码质量](https://zhida.zhihu.com/search?content_id=225380939&content_type=Article&match_order=1&q=%E4%BB%A3%E7%A0%81%E8%B4%A8%E9%87%8F&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDA4NDU4MzEsInEiOiLku6PnoIHotKjph48iLCJ6aGlkYV9zb3VyY2UiOiJlbnRpdHkiLCJjb250ZW50X2lkIjoyMjUzODA5MzksImNvbnRlbnRfdHlwZSI6IkFydGljbGUiLCJtYXRjaF9vcmRlciI6MSwiemRfdG9rZW4iOm51bGx9.UPMvxJFPT3qY9kjRjvvPkzHaqf1TPn_PTkD8bNdN1Oo&zhida_source=entity)。
# 3. gomodifytags
该工具可以快速修改结构体字段tag的值。比如对于JSON或YAML序列化时需要使用的 tag，可以直接使用该工具修改。
# 4. impl
该工具可以根据接口自动生成对应的方法模板。可以让我们更加方便地实现某些接口。
# 5. goplay
该工具可以让我们在浏览器上运行 Go 代码片段并查看输出结果。非常适合写一些简短的测试代码。
# 6. dlv
该工具是 Go 语言的[调试器](https://zhida.zhihu.com/search?content_id=225380939&content_type=Article&match_order=1&q=%E8%B0%83%E8%AF%95%E5%99%A8&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDA4NDU4MzEsInEiOiLosIPor5XlmagiLCJ6aGlkYV9zb3VyY2UiOiJlbnRpdHkiLCJjb250ZW50X2lkIjoyMjUzODA5MzksImNvbnRlbnRfdHlwZSI6IkFydGljbGUiLCJtYXRjaF9vcmRlciI6MSwiemRfdG9rZW4iOm51bGx9.1J46lwBrtoZAQxq0ogiJEGxjPCzj71ssiZTyRhqnABY&zhida_source=entity)，可以帮助我们在开发过程中快速定位问题。
# 7. staticcheck
该工具可以检查 Go 代码中的静态错误，包括数据竞争，错误的 API 用法等等，可以帮助我们减少一些常见的错误。