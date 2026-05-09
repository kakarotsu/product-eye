# 系统架构说明 - Product Eye

## 整体架构

Product Eye 是一个单页应用（SPA），完全在浏览器中运行。无服务端，无数据库服务器，无 API 调用。

```
┌─────────────────────────────────────────────┐
│               Android Chrome                 │
│  ┌─────────────────────────────────────────┐ │
│  │            Service Worker               │ │
│  │  (离线缓存：静态资源 + CDN 库 + 模型)    │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │            应用层 (JS ES Modules)        │ │
│  │                                         │ │
│  │  router.js ──► 页面 (pages/)            │ │
│  │     │              │                    │ │
│  │     │              ├─ home.js           │ │
│  │     │              ├─ scan-barcode.js   │ │
│  │     │              ├─ identify-photo.js │ │
│  │     │              ├─ product-list.js   │ │
│  │     │              ├─ product-form.js   │ │
│  │     │              └─ result.js         │ │
│  │     │              │                    │ │
│  │     │        服务层 (services/)          │ │
│  │     │              │                    │ │
│  │     │              ├─ barcode-service   │ │
│  │     │              ├─ camera-service    │ │
│  │     │              ├─ recognition-svc   │ │
│  │     │              └─ tts-service       │ │
│  │     │              │                    │ │
│  │     │        引擎层 (engine/)            │ │
│  │     │              │                    │ │
│  │     │              ├─ dhash.js          │ │
│  │     │              ├─ mobilenet-engine  │ │
│  │     │              └─ similarity.js     │ │
│  │     │                                   │ │
│  │     └─ db.js ──── IndexedDB             │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 分层说明

### 存储层
- **IndexedDB**：浏览器内置的 NoSQL 数据库，存储商品数据、参考照片、用户设置
- 通过 `idb` 库（Jake Archibald）封装为 Promise 风格 API
- 无需网络，所有数据完全在本地

### 引擎层
- **dhash.js**：感知哈希算法，将图片转为 64 位指纹，用汉明距离比较相似度
- **mobilenet-engine.js**：管理 TensorFlow.js MobileNet 模型的加载、缓存、推断
- **similarity.js**：封装汉明距离和余弦相似度两种匹配算法

### 服务层
- **camera-service.js**：封装 getUserMedia 相机操作（权限、对焦、截图）
- **barcode-service.js**：封装条码扫描（优先 BarcodeDetector API，备选 ZXing）
- **recognition-service.js**：编排完整识别流程（压缩 → 哈希 → 比对 → 排序）
- **tts-service.js**：封装语音播报（中文 TTS，语速/音量控制）

### 页面层
- 每个页面是一个独立模块，负责渲染自己的 DOM
- 由 router.js 根据 URL hash 调度
- 页面不直接操作 IndexedDB，通过 db.js 和 services 访问数据

### 基础设施
- **router.js**：监听 hashchange 事件，匹配路由到页面模块
- **app.js**：应用入口，初始化 DB、注册 Service Worker、启动路由
- **index.html**：SPA 外壳，声明 viewport、加载脚本
- **manifest.json**：PWA 清单，定义应用名称、图标、显示模式
- **sw.js**：Service Worker，管理离线缓存

## 数据流

### 条码识别流程
```
用户点击"扫描条码"
→ router 加载 scan-barcode.js
→ scan-barcode 调用 camera-service 打开相机
→ 视频流传入 barcode-service 逐帧检测
→ 检测到条码 → 调用 db.getProductByBarcode()
→ 找到商品 → router 跳转 result 页面
→ result 页面调用 tts-service 播报
```

### 拍照识别流程
```
用户点击"拍照识别"
→ router 加载 identify-photo.js
→ 用户拍照 → image-utils 压缩为 224×224 WebP
→ recognition-service.identify(blob)
    → dhash.compute(blob) → 汉明距离比对所有已存图
    → 取 Top 5 候选 → [可选] MobileNet 重排序
    → 返回最佳匹配
→ 匹配成功 → router 跳转 result 页面
→ 匹配失败 → 显示"未识别"提示
```

### 商品录入流程
```
用户点击"添加商品"
→ router 加载 product-form.js
→ 用户拍照 → image-utils 压缩 → 存入表单状态
→ 用户输入名称、价格、（可选）扫描条码
→ 用户保存 → db.addProduct()
    → 对每张参考图计算 dHash
    → [如 MobileNet 已加载] 计算 embedding
    → 写入 IndexedDB
→ 返回商品列表
```

## 关键设计决策

1. **无构建工具**：纯 ES 模块 + CDN 外部库，避免 npm/webpack 复杂度，GitHub Pages 直接托管
2. **双轨识别**：dHash 保证极速可用（零下载），MobileNet 提供更高精度（可选增强）
3. **Cache-First Service Worker**：首次访问后完全离线，包括模型文件
4. **UUID 主键**：避免自增 ID 冲突，支持未来数据导出/导入
5. **WebP 压缩**：所有参考图压缩到 224×224 WebP，单张约 15KB，总量可控
