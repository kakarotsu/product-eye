# Product Eye 项目指引

## 项目简介
为老年人设计的 Android PWA 商品识价应用。拍照/扫条码 → 识别商品 → 语音播报价格。
完全离线运行，私人部署，不上架应用商店。

## 标准文件路径
- 产品需求：[docs/requirements.md](docs/requirements.md)
- 技术规格：[docs/tech-spec.md](docs/tech-spec.md)
- 设计规范：[docs/design-spec.md](docs/design-spec.md)
- 系统架构：[docs/architecture.md](docs/architecture.md)
- 开发计划：[docs/development-plan.md](docs/development-plan.md)
- 开发日志：[dev-log/](dev-log/)（按日期命名，如 2026-05-09.md）

## 工作规范
1. 严格按照 docs/development-plan.md 的阶段顺序执行，不跳步
2. 每完成一个步骤，更新 dev-log/ 当日日志（记录完成事项和待办事项）
3. 每个阶段完成后，请用户确认再进入下一阶段
4. 所有代码放在 product-eye/ 目录下
5. 纯 HTML/CSS/JS，不引入构建工具（npm、webpack、vite 等）
6. UI 必须遵循 docs/design-spec.md 中的老年友好规范
7. 所有界面文字使用中文
8. 每步做完都要产出可验证的效果
9. 不做过度设计，不引入当前阶段不需要的代码
10. 用户说"停"立即停止，汇报当前进度

## 技术边界
- 浏览器端运行，无服务端
- 数据存储仅使用 IndexedDB，不涉及网络传输
- 第三方库通过 CDN 加载（idb、ZXing、TensorFlow.js），由 Service Worker 缓存
- 目标浏览器：Android Chrome（支持 Barcode Detection API、Web Speech API、Service Worker）
