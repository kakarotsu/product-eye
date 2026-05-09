# 开发执行计划 - Product Eye

## 开发原则
- 分阶段执行，每阶段产出可独立验证
- 每阶段完成后：更新 dev-log，请用户确认，再进入下一阶段
- 优先完成核心功能，后续阶段可以细化
- 每步只做当前阶段需要的事，不过度设计

## 阶段总览

| 阶段 | 名称 | 目标 | 预计文件数 |
|------|------|------|------|
| 0 | 项目初始化 | 建好所有目录和标准文档 | 7 个文档 |
| 1 | 基础框架 | 浏览器打开能看到首页 | 6 个代码文件 |
| 2 | 商品管理 | 能录入、查看、删除商品 | 4 个代码文件 |
| 3 | 条码扫描 | 扫条码自动识别商品 | 3 个代码文件 + DB 扩展 |
| 4 | 拍照识别 | 拍照匹配商品 | 5 个代码文件 |
| 5 | 语音与结果 | 识别后语音播报 | 3 个代码文件 |
| 6 | 离线化 | 断网可用，添加到桌面 | 3 个代码文件 |
| 7 | 部署上线 | 手机正式使用 | 图标 + 配置 |

---

## 阶段 0：项目初始化
**产出**：目录结构、标准文档、CLAUDE.md

- [x] 0.1 创建项目目录结构
- [x] 0.2 创建 CLAUDE.md
- [x] 0.3 创建 docs/requirements.md
- [x] 0.4 创建 docs/tech-spec.md
- [x] 0.5 创建 docs/design-spec.md
- [x] 0.6 创建 docs/architecture.md
- [x] 0.7 创建 docs/development-plan.md
- [x] 0.8 创建 dev-log/2026-05-09.md

---

## 阶段 1：基础框架
**产出**：可打开的 SPA 骨架，显示首页

- [ ] 1.1 创建 index.html（SPA 结构、viewport、加载外部库）
- [ ] 1.2 创建 manifest.json（PWA 基础配置）
- [ ] 1.3 创建 app.css（CSS 变量、布局、按钮、文字样式）
- [ ] 1.4 创建 router.js（hash 路由，页面注册与切换）
- [ ] 1.5 创建 db.js（IndexedDB 初始化，products 和 settings store）
- [ ] 1.6 创建 app.js（初始化：开 DB → 加载设置 → 启路由 → 注册 SW）
- [ ] 1.7 创建 home.js（四宫格首页，按钮跳转）

---

## 阶段 2：商品管理
**产出**：完整的商品增删改查功能

- [ ] 2.1 创建 product-list.js（商品列表 + 搜索过滤 + 空状态）
- [ ] 2.2 创建 product-form.js（录入/编辑表单，含条码扫描按钮）
- [ ] 2.3 创建 image-utils.js（Canvas 压缩为 224×224 WebP + 96×96 缩略图）
- [ ] 2.4 product-form 集成拍照录入参考图（最多 5 张）
- [ ] 2.5 完善 home.js，实现四宫格跳转到各页面

---

## 阶段 3：条码扫描
**产出**：相机扫描条码并自动识别

- [ ] 3.1 创建 camera-service.js（getUserMedia，权限处理，前后摄像头）
- [ ] 3.2 创建 barcode-service.js（BarcodeDetector API，ZXing 备选）
- [ ] 3.3 创建 scan-barcode.js（全屏取景 + 取景框 + 自动检测 + 取消）
- [ ] 3.4 db.js 添加 getProductByBarcode() 方法

---

## 阶段 4：拍照识别
**产出**：拍照后自动匹配已录入商品

- [ ] 4.1 创建 dhash.js（纯 JS 感知哈希：9×8 灰度 → 64 位指纹）
- [ ] 4.2 创建 mobilenet-engine.js（TF.js 加载、特征提取、下载进度）
- [ ] 4.3 创建 similarity.js（汉明距离 + 余弦相似度）
- [ ] 4.4 创建 recognition-service.js（压缩 → 哈希 → Top5 → 重排 → 结果）
- [ ] 4.5 创建 identify-photo.js（拍照页面 + 识别中状态 + 调用识别服务）

---

## 阶段 5：语音与结果
**产出**：识别后大字号结果页 + 语音播报

- [ ] 5.1 创建 tts-service.js（中文语音合成，语速/音量控制）
- [ ] 5.2 创建 result.js（商品图 + 名称 + 价格大字 + 匹配度 + 返回）
- [ ] 5.3 条码扫描和拍照识别结果统一跳转到 result 页面

---

## 阶段 6：离线化
**产出**：断网可用，可添加到手机桌面

- [ ] 6.1 创建 sw.js（install 预缓存 + fetch Cache-First + activate 清理）
- [ ] 6.2 app.js 中注册 Service Worker
- [ ] 6.3 完善 manifest.json（多尺寸图标、theme_color、display: standalone）
- [ ] 6.4 创建 storage-utils.js（navigator.storage.estimate 监控配额）

---

## 阶段 7：部署上线
**产出**：手机上正式使用

- [ ] 7.1 生成 App 图标（72/96/128/144/152/192/384/512 px）
- [ ] 7.2 创建 GitHub 仓库，推送代码
- [ ] 7.3 配置 GitHub Pages（Settings → Pages → main 分支）
- [ ] 7.4 手机 Chrome 打开 → 添加到桌面
- [ ] 7.5 端到端测试（录入 → 扫码 → 拍照 → 离线 → 语音）
