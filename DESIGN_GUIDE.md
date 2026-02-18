# 🌅 日落橙主题设计指南

## 设计理念

这是一个**温暖极简主义**设计系统,以日落橙色为核心,营造温暖、舒适、专业的阅读体验。

### 核心特点

- **🌅 温暖配色** - 日落橙色系,温暖而不刺眼
- **✨ 精致微动效** - 恰到好处的交互反馈
- **📝 优雅字体** - 现代无衬线 + 经典衬线的组合
- **🎨 呼吸感布局** - 慷慨的留白和清晰的层次

---

## 🎨 配色系统

### 主色调 - 日落橙

```css
--color-accent-primary: #FF8C42      /* 主橙色 - 日落的核心色彩 */
--color-accent-secondary: #FF6F1E    /* 深橙色 - 用于 hover 状态 */
--color-accent-highlight: #FFB380    /* 浅橙色 - 用于高亮 */
--color-accent-soft: #FFE5D3         /* 柔和橙 - 背景和标签 */
```

### 背景色 - 温暖中性色

```css
--color-bg-primary: #FFFCF9          /* 主背景 - 温暖的白色 */
--color-bg-secondary: #FFF8F3        /* 次级背景 - 卡片背景 */
--color-bg-tertiary: #FFE8D9         /* 三级背景 - 高亮区域 */
```

### 文字色 - 深棕色系

```css
--color-text-primary: #2D1810        /* 主文字 - 深棕色 */
--color-text-secondary: #5C3D2E      /* 次级文字 */
--color-text-tertiary: #8B7269       /* 三级文字 - 辅助信息 */
```

### 暗色模式 - 舒适夜间主题

```css
--color-dark-bg-primary: #1A0F08     /* 深棕色背景 */
--color-dark-bg-secondary: #2D1810   /* 卡片背景 */
--color-dark-accent-primary: #FFA466 /* 更柔和的橙色 */
```

---

## ✍️ 字体系统

### 字体族

```css
--font-display: 'Outfit'             /* 标题 - 现代几何无衬线 */
--font-body: 'Crimson Pro'           /* 正文 - 优雅衬线体 */
--font-mono: 'JetBrains Mono'        /* 代码 - 等宽字体 */
```

### 为什么选择这些字体?

- **Outfit**: 现代、几何、清晰,适合标题和导航
- **Crimson Pro**: 温暖、优雅、易读,专为长文阅读优化
- **JetBrains Mono**: 专业、清晰,为代码阅读设计

### 字号层级

| 用途 | 变量 | 大小 | 说明 |
|------|------|------|------|
| 超大标题 | `--font-size-5xl` | 72px | Hero 区域主标题 |
| 一级标题 | `--font-size-4xl` | 52px | 文章详情页标题 |
| 二级标题 | `--font-size-3xl` | 40px | 主要章节标题 |
| 三级标题 | `--font-size-2xl` | 30px | 次级章节标题 |
| 正文大号 | `--font-size-lg` | 21px | 文章内容 |
| 正文标准 | `--font-size-base` | 18px | 普通文本 |
| 小号文字 | `--font-size-sm` | 15px | 辅助信息 |

---

## 📐 间距系统

采用 8px 基础单位的倍数,确保视觉和谐:

```css
--spacing-xs: 0.375rem    /* 6px  - 紧凑间距 */
--spacing-sm: 0.625rem    /* 10px - 小间距 */
--spacing-md: 1rem        /* 16px - 标准间距 */
--spacing-lg: 1.75rem     /* 28px - 大间距 */
--spacing-xl: 2.5rem      /* 40px - 特大间距 */
--spacing-2xl: 4rem       /* 64px - 区块间距 */
--spacing-3xl: 6rem       /* 96px - Hero 区域 */
```

---

## 🎯 关键组件设计

### 1. Hero 区域

**特点:**
- 超大标题,渐变文字效果
- 背景径向渐变光晕
- 淡入上移动画

**实现:**
```css
.hero h1 {
    font-size: 72px;
    font-weight: 800;
    background: linear-gradient(135deg, #2D1810 0%, #FF8C42 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.hero::before {
    /* 背景光晕效果 */
    background: radial-gradient(circle, rgba(255, 140, 66, 0.12), transparent 70%);
}
```

### 2. 文章卡片

**特点:**
- 悬停时上移 6px
- 顶部橙色渐变条
- 温暖阴影效果
- 标签 pill 形状

**交互:**
- Hover: 上移 + 阴影增强 + 顶部条展开
- Tag Hover: 背景变橙色 + 上移

```css
.article-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-accent-primary);
}

.article-card::before {
    /* 顶部橙色渐变条 */
    background: linear-gradient(90deg, #FF8C42, #FFB380);
    transform: scaleX(0);  /* 默认隐藏 */
}

.article-card:hover::before {
    transform: scaleX(1);  /* 悬停展开 */
}
```

### 3. 导航栏

**特点:**
- 毛玻璃效果 (backdrop-filter)
- Sticky 定位
- 底部小橙色下划线
- 柔和背景色

**交互:**
- Hover: 背景变橙色 + 下划线展开
- Active: 橙色文字 + 加粗

```css
.page-header {
    background-color: rgba(255, 252, 249, 0.85);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
}

.nav-link::before {
    /* 底部小下划线 */
    width: 20px;
    height: 2px;
    background: var(--color-accent-primary);
    transform: scaleX(0);
}

.nav-link:hover::before {
    transform: scaleX(1);
}
```

### 4. 主题切换按钮

**特点:**
- 旋转动画
- 图标渐变过渡
- Hover 时缩放 + 旋转

```css
.theme-toggle-btn:hover {
    transform: scale(1.05) rotate(20deg);
    box-shadow: var(--shadow-warm);
}

[data-theme="dark"] .sun-icon {
    opacity: 0;
    transform: rotate(-180deg);
}
```

### 5. 文章详情页

**优化:**
- 最大宽度 85ch (舒适阅读宽度)
- 字号 21px,行高 1.8
- 标题之间大间距
- 代码块柔和阴影
- 引用块渐变背景

```css
article .content {
    font-size: 21px;
    line-height: 1.8;
    max-width: 85ch;
}

blockquote {
    border-left: 4px solid #FF8C42;
    background: linear-gradient(90deg, #FFE5D3 0%, transparent 100%);
}

pre {
    background-color: var(--color-bg-secondary);
    box-shadow: var(--shadow-sm);
    border-radius: 20px;
}
```

---

## ✨ 动画系统

### 过渡时间

```css
--transition-fast: 0.2s       /* 快速交互 */
--transition-normal: 0.35s    /* 标准过渡 */
--transition-slow: 0.5s       /* 慢速动画 */
```

### 缓动函数

```css
cubic-bezier(0.4, 0, 0.2, 1)      /* 标准缓动 */
cubic-bezier(0.34, 1.56, 0.64, 1) /* 弹性缓动 */
```

### 关键动画

1. **fadeInUp** - 淡入上移
   ```css
   @keyframes fadeInUp {
       from {
           opacity: 0;
           transform: translateY(24px);
       }
       to {
           opacity: 1;
           transform: translateY(0);
       }
   }
   ```

2. **scaleIn** - 缩放淡入
   ```css
   @keyframes scaleIn {
       from {
           opacity: 0;
           transform: scale(0.96);
       }
       to {
           opacity: 1;
           transform: scale(1);
       }
   }
   ```

### 延迟动画

文章卡片使用阶梯式延迟,营造流畅加载感:

```css
.article-card:nth-child(1) { animation-delay: 0.1s; }
.article-card:nth-child(2) { animation-delay: 0.2s; }
.article-card:nth-child(3) { animation-delay: 0.3s; }
```

---

## 🎭 阴影系统

使用橙色色调的阴影,强化温暖主题:

```css
--shadow-sm: 0 2px 8px rgba(255, 140, 66, 0.08);
--shadow-md: 0 4px 16px rgba(255, 140, 66, 0.12),
             0 2px 8px rgba(45, 24, 16, 0.04);
--shadow-lg: 0 12px 32px rgba(255, 140, 66, 0.16),
             0 4px 16px rgba(45, 24, 16, 0.06);
--shadow-warm: 0 8px 24px rgba(255, 140, 66, 0.24);
```

---

## 📱 响应式设计

### 断点

```css
--breakpoint-sm: 576px   /* 手机横屏 */
--breakpoint-md: 768px   /* 平板 */
--breakpoint-lg: 992px   /* 桌面 */
--breakpoint-xl: 1200px  /* 大屏 */
```

### 移动端优化

- 侧边栏变为抽屉式
- Hero 标题缩小到 40px
- 卡片单列布局
- 导航简化

---

## 🌙 暗色模式

### 设计原则

- 保持温暖调性 (深棕色而非纯黑)
- 橙色更柔和 (#FFA466)
- 降低对比度,保护眼睛
- 所有组件统一适配

### 实现

```css
[data-theme="dark"] {
    --color-bg-primary: #1A0F08;          /* 深棕背景 */
    --color-accent-primary: #FFA466;       /* 柔和橙 */
}
```

---

## 🚀 使用指南

### 查看设计预览

打开 `design-preview.html` 在浏览器中查看完整的设计系统展示。

### 应用到你的博客

1. **字体已更新** - `layout.html` 中已引入 Outfit、Crimson Pro、JetBrains Mono
2. **样式已优化** - `style.css` 包含完整的日落橙主题
3. **组件已就绪** - 所有 HTML 模板兼容新样式

### 生成博客

```bash
npx obsidian-blog generate
```

### 测试主题切换

点击右上角的主题切换按钮,体验亮/暗色模式。

---

## 🎨 设计亮点总结

### 视觉特色

1. **温暖色调** - #FF8C42 日落橙贯穿始终
2. **渐变效果** - Hero 标题、顶部条、引用块
3. **柔和圆角** - 8px-40px 的渐进圆角系统
4. **橙色阴影** - 强化主题色调

### 交互体验

1. **精致微动效** - 所有交互都有流畅过渡
2. **悬停反馈** - 上移、缩放、颜色变化
3. **阶梯动画** - 卡片依次淡入
4. **主题切换** - 旋转 + 渐变过渡

### 阅读体验

1. **大字号** - 正文 21px,舒适阅读
2. **宽行距** - 1.8 行高,降低视觉疲劳
3. **优雅字体** - Crimson Pro 衬线体
4. **充足留白** - 慷慨的间距设计

---

## 📚 参考资源

- [Outfit 字体](https://fonts.google.com/specimen/Outfit)
- [Crimson Pro 字体](https://fonts.google.com/specimen/Crimson+Pro)
- [JetBrains Mono 字体](https://www.jetbrains.com/lp/mono/)
- [Color Hunt - Orange Palettes](https://colorhunt.co/)

---

**设计完成时间**: 2025年1月

**设计师**: Claude (Anthropic)

**主题名称**: 日落橙 (Sunset Orange)
