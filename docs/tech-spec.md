# 技术规格说明 - Product Eye

## 技术栈
| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | 纯 HTML/CSS/JS（ES 模块） | 无构建工具，零依赖开发环境 |
| 数据库 | IndexedDB（idb 库封装） | 浏览器本地存储 |
| 条码识别 | Barcode Detection API | Chrome 原生，硬件加速 |
| 条码备选 | @zxing/library | 纯 JS 条码解码 |
| 图像识别 | dHash 感知哈希 | 纯 JS 实现，零下载 |
| 图像增强 | TensorFlow.js + MobileNet | 神经网络特征提取，可选加载 |
| 语音 | Web Speech API | Chrome 内置 TTS |
| 离线 | Service Worker | 静态资源 + 模型缓存 |
| 部署 | GitHub Pages | 免费 HTTPS 托管 |

## 浏览器兼容性目标
- **主要目标**：Android Chrome 83+
- Barcode Detection API：Chrome 83+
- Web Speech API：Chrome 33+
- Service Worker：Chrome 45+
- IndexedDB：Chrome 25+
- getUserMedia：Chrome 53+

## IndexedDB 数据模型

### Store: products
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 主键 |
| name | string | 商品名称 |
| price | number | 用户设定价格 |
| barcode | string? | 条码数字（可空） |
| referencePhotos | Array\<Object\> | 参考照片数组 |
| createdAt | number | 创建时间戳 |
| updatedAt | number | 更新时间戳 |

### referencePhotos 子对象
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 照片 ID |
| blob | Blob | WebP 224×224 压缩图 |
| thumbnail | Blob | 96×96 缩略图 |
| dhash | string | 64 位感知哈希（16 进制） |
| embedding | Float32Array? | MobileNet 1280 维特征向量 |
| takenAt | number | 拍摄时间戳 |

### Indexes
- `barcode` — 唯一索引，快速条码查找
- `name` — 商品名称排序
- `updatedAt` — 最近更新排序

### Store: settings
| 键 | 类型 | 默认值 | 说明 |
|------|------|------|------|
| modelDownloaded | boolean | false | MobileNet 是否已缓存 |
| voiceRate | number | 0.9 | 语速 0.5-2.0 |
| voicePitch | number | 1.0 | 音调 0.5-2.0 |
| voiceVolume | number | 1.0 | 音量 0-1 |
| confidenceThreshold | number | 0.65 | 匹配阈值 |
| schemaVersion | number | 1 | 数据版本号 |

## 识别算法

### 条码识别流程
```
请求相机 → 视频流 → BarcodeDetector.detect() 每帧
→ 检测到条码 → 停止相机 → 查 IndexedDB → 返回结果
备选：@zxing/library BrowserMultiFormatReader
支持格式：EAN-8, EAN-13, UPC-A, UPC-E, Code-128, Code-39
```

### 拍照识别流程
```
拍照 → Canvas 压缩 224×224 WebP
→ dHash 感知哈希（9×8 灰度图，64 位指纹）
→ 汉明距离比对所有已存照片，取 Top 5（距离 < 12）
→ [如有 MobileNet] 对查询图和 Top 5 提取 1280 维特征
→ 余弦相似度重排 → 返回最佳匹配（相似度 > 阈值）
```

### 相似度阈值
| 方法 | 匹配阈值 | 说明 |
|------|------|------|
| dHash 汉明距离 | < 10 | 距离越小越相似 |
| MobileNet 余弦相似度 | > 0.65 | 默认，可在设置中调节 |

## Service Worker 缓存策略
- **预缓存（install 事件）**：index.html、app.css、所有 JS 文件、图标、音效、CDN 库（idb、ZXing）
- **懒加载**：TensorFlow.js + MobileNet 模型（首次使用时后台下载，显示进度）
- **策略**：Cache-First（静态资源）、Network-First（模型文件，支持更新）

## 存储预估
- 50 商品 × 3 照片 × 15KB WebP = 2.25MB
- 50 商品 × 3 照片 × 5.1KB 特征向量 = 0.77MB
- 元数据（名称、价格、条码等） < 0.1MB
- **合计约 3.1MB**，远低于浏览器存储配额
