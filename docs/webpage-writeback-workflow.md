# 网页写回 Figma 复用流程

适用场景：把已经实现的网页页面写入 Figma，并要求 Figma 源文件和网页在布局、语义、颜色、字体、图片、组件状态上保持一致。本文沉淀自方德学习机独立站首页和 iPad 详情页写回流程，可复用到其他页面。

## 核心原则

1. 先抓真实页面，再写 Figma。不要凭截图印象或手感重画。
2. Figma 节点要和网页语义对应，而不是只追求视觉相似。
3. 颜色优先引用组件库变量；没有的颜色新增到 variables 后再绑定。
4. 图片区域必须使用真实图片资产和真实坐标，不能用占位图或随意裁切。
5. 每写一段就截图校验，不能等整页写完才发现错位。
6. 不要给页面加源码里没有的状态，例如误把参数明细做成选中态。

## 标准流程

### 1. 明确目标页面

记录这些信息：

- 页面 URL，例如 `http://127.0.0.1:4173/#/product/pilot`
- Figma 文件 key
- Figma 目标页面或节点 ID
- 页面宽度，例如 `1440px`
- 内容宽度，例如 `1200px`
- 需要写入的页面范围：整页、首屏、详情页、弹窗或局部模块

如果用户说“按现在页面写”，必须以当前网页为准，不以旧 MD、旧截图、旧设计稿为准。

### 2. 抓取真实网页结构

抓取内容建议包括：

- `body` 尺寸和滚动高度
- CSS 变量，例如文本色、边框色、背景色、品牌色、圆角
- 每个 section 的 `x/y/width/height`
- 标题、文案的真实坐标和字体大小
- 图片的真实坐标、尺寸、src、alt、naturalWidth、naturalHeight
- sticky/fixed 元素的位置和层级

产物建议保存为：

- `tmp/figma-layout-capture.json`
- `tmp/homepage-1440.png`
- `tmp/detail-pilot-1440.png`

抓取后先人工看一遍截图，确认页面本身没有坏。

### 3. 拆分页面模块

每个 Figma 顶层模块要对应网页模块，例如：

- `Header`
- `Hero`
- `Detail Hero`
- `Product Gallery`
- `Product Info / Version Selection`
- `Metrics Strip`
- `Sticky Buy Bar`
- `Spec Compare`
- `Purchase Plan`

模块不要混在一起。后续检查和修改时，能直接定位到对应节点。

### 4. 建立变量映射

优先搜索或引用组件库中的变量。没有时，在当前文件创建本地变量集合，例如：

`Codex / Page Tokens`

建议至少沉淀：

- `codex/color/white`
- `codex/color/title`
- `codex/color/text`
- `codex/color/text-2`
- `codex/color/text-3`
- `codex/color/line`
- `codex/color/surface`
- `codex/color/surface-2`
- `codex/color/brand`
- `codex/color/brand-weak`
- `codex/color/brand-weakest`

创建变量时要设置正确 scope：

- 文本色：`TEXT_FILL`
- 背景色：`FRAME_FILL`、`SHAPE_FILL`
- 描边色：`STROKE_COLOR`

注意：Figma 当前 API 使用 `STROKE_COLOR`，不要写旧的 `STROKE`。

### 5. 处理图片资产

Figma Plugin API 不能直接从网页 URL 读取图片。推荐流程：

1. 把网页中使用的图片上传到 Figma。
2. 记录每张图的 `imageHash`。
3. 写入页面时用 image fill 绑定对应 `imageHash`。
4. 上传过程产生的临时放置节点要清理。

图片展示区尤其要严谨：

- 主图坐标必须和网页一致
- 缩略图坐标必须和网页一致
- 缩略图选中描边要使用网页真实颜色
- 外层容器需要 `clipsContent = true`
- 图片填充方式和网页 `object-fit` 对齐，通常为 `FILL`

不要用“看着差不多”的图片裁切。

### 6. 写入 Figma

推荐分段写入，不要一次性写整页：

1. 变量和画板
2. Header
3. Hero 或详情首屏
4. 图片区
5. 配置信息区
6. sticky/fixed 底部栏
7. 参数/列表/购买方案等长内容
8. 最后截图和结构校验

每次写入必须返回：

- 创建的主 frame ID
- 当前模块 ID
- 关键节点数量
- 模块位置和尺寸

示例返回：

```json
{
  "status": "gallery-fixed",
  "frameId": "1053:17",
  "gallery": {
    "id": "1089:2",
    "x": 120,
    "y": 137,
    "width": 632,
    "height": 723,
    "clipsContent": true
  }
}
```

### 7. 坐标校验

写入后必须用脚本读取 Figma 节点坐标，和网页抓取结果对比。

重点校验：

- 画板宽高
- 顶层模块 y 值和高度
- 图片坐标
- 缩略图坐标
- sticky bar 坐标
- 两列/三列/四列 grid 的 x、width、gap
- 是否有源码里没有的选中态

例如图片区的校验结果应类似：

```json
{
  "gallery": { "x": 120, "y": 137, "w": 632, "h": 723, "clipsContent": true },
  "images": [
    { "name": "Main Image", "x": 134, "y": 151, "w": 594, "h": 530 },
    { "name": "Thumbnail 1", "x": 139, "y": 732, "w": 131, "h": 109 },
    { "name": "Thumbnail 2", "x": 290, "y": 732, "w": 131, "h": 109 }
  ]
}
```

### 8. 截图复核

结构通过后，必须拉 Figma 截图复核。

推荐保存：

- `tmp/figma-homepage-fixed.png`
- `tmp/figma-detail-fixed.png`
- `tmp/figma-detail-gallery-fixed.png`

复核时不要只看全页缩略图。要重点看：

- 首屏是否和网页一致
- 图文有没有贴边、重叠、溢出
- 图片是否被裁坏
- 选中态是否多加了
- 图标是否偏位
- 参数表左右是否对齐
- sticky bar 是否遮挡正常

## 常见错误和修正方法

### 错误 1：凭感觉画，导致和网页不一致

表现：

- 模块标题不一致
- 排版结构不一致
- 多了网页没有的图片
- 两列宽度和间距不一致

修正：

- 回到 `figma-layout-capture.json`
- 按真实 DOM/CSS 坐标重写模块
- 删除错误模块，不在错误模块上打补丁

### 错误 2：误加选中态

表现：

- 参数明细右列变成绿色
- 明细卡片像可点击选项

修正：

- 检查源码是否真的有 `.active` 样式
- 如果源码没有，就统一使用普通背景变量
- 不要把“当前商品”理解成“参数表选中状态”

### 错误 3：icon 错位

表现：

- 线条 icon 不在中心
- icon 形状和网页不同
- 左右两列 icon 对不齐

修正：

- 不要手工画近似图标
- 直接使用网页 SVG path
- 保持同样的 `viewBox`
- icon 外框统一为 `48px`
- SVG 本体按网页尺寸，例如 `34px`

### 错误 4：图片区错乱

表现：

- 缩略图行散开
- 图片卡片高度不够
- 图片溢出卡片
- 选中缩略图颜色不对

修正：

- 用抓取到的真实坐标：
  - gallery：`x=120, y=137, w=632`
  - 主图：`x=134, y=151, w=594, h=530`
  - 缩略图：`y=732, w=131, h=109`
- 外层开启 `clipsContent`
- active stroke 使用品牌色变量
- 背景使用网页真实渐变，不要硬切色块

### 错误 5：一次写入太大导致失败

表现：

- Figma tool 返回网络发送失败
- `wham/apps` 请求失败
- MCP 握手超时

修正：

- 先跑一个小探针确认通道是否恢复
- 把写入拆成多段
- 减少返回 payload
- 每段只返回关键节点 ID 和坐标

## 可插件化方案

后续可以把流程封装成 Codex/Figma 插件或脚本，建议命令设计如下：

### 命令 1：抓取网页

输入：

- URL
- viewport 宽高
- 页面名称

输出：

- 页面截图
- 布局 JSON
- 图片资源清单

### 命令 2：上传资产

输入：

- 图片路径数组
- Figma fileKey

输出：

- imageHash 映射表

### 命令 3：写入 Figma

输入：

- Figma fileKey
- target page/node id
- layout JSON
- imageHash 映射表
- token 映射表

输出：

- 主画板 ID
- 模块节点 ID
- 写入日志

### 命令 4：校验 Figma

输入：

- 主画板 ID
- layout JSON

输出：

- 坐标差异报告
- 截图
- 问题清单

## 推荐执行清单

每次写回页面前检查：

- [ ] 当前网页截图已更新
- [ ] `figma-layout-capture.json` 已更新
- [ ] 图片资产已上传并拿到 imageHash
- [ ] Figma 目标页面确认无误
- [ ] 颜色变量已存在或已创建
- [ ] 写入脚本按模块拆分

每次写回页面后检查：

- [ ] 顶层模块数量正确
- [ ] 画板宽度正确
- [ ] 内容宽度为 1200px
- [ ] 图片区坐标正确
- [ ] grid 列宽和 gap 正确
- [ ] 没有多余选中态
- [ ] 图标使用网页 SVG 或组件库图标
- [ ] Figma 截图和网页截图对比通过

## 本项目已验证的关键数据

iPad 领航版详情页：

- 画板：`1440 x 3391`
- 内容宽：`1200`
- Header：`0, 0, 1440, 65`
- Detail Hero：`0, 65, 1440, 980`
- Product Gallery：`120, 137, 632, 723`
- 主图：`134, 151, 594, 530`
- 缩略图：
  - `139, 732, 131, 109`
  - `290, 732, 131, 109`
  - `441, 732, 131, 109`
  - `592, 732, 131, 109`
- Sticky Buy Bar：`0, 1104, 1440, 76`
- Spec Compare：`0, 1365, 1440, 2026`
- 参数列：
  - 基础版：`260, 274, 446, 1432`
  - 领航版：`734, 274, 446, 1432`

## 最终交付格式

每次完成后建议回复用户：

- 写入的 Figma 页面链接
- 主画板 ID
- 修复或新增的模块 ID
- 本地截图路径
- 已验证的关键点
- 没有修改网页代码时要明确说明
