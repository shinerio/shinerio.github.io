- top完成所有包转发和包处理，一旦网络连接建立了，转发只在Top层完成
- Flow Master记录网络连接，充当Decider的缓存
- Decider实现网络逻辑，对于NAT来说就是进行会话分配

Flow Master可以主主扩展，利用率可以做得比较高，而Decider利用率相对来说较低。

