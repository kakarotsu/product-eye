import { navigate } from '../router.js';

export function render(app) {
  app.innerHTML = `
    <div class="page active" style="display:flex;flex-direction:column;">
      <div class="page-content" style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">
        <h1 class="page-title" style="text-align:center;margin-bottom:24px;">商品识价</h1>
        <div class="home-grid" style="padding-top:0;">
        <button class="home-card" id="btn-scan">
          <span class="card-icon">📷</span>
          <span class="card-label">扫描条码</span>
        </button>
        <button class="home-card" id="btn-identify">
          <span class="card-icon">📸</span>
          <span class="card-label">拍照识别</span>
        </button>
        <button class="home-card" id="btn-products">
          <span class="card-icon">📋</span>
          <span class="card-label">我的商品</span>
        </button>
        <button class="home-card" id="btn-settings">
          <span class="card-icon">⚙️</span>
          <span class="card-label">设置</span>
        </button>
      </div>
      </div>
    </div>
  `;

  document.getElementById('btn-scan').addEventListener('click', () => navigate('#scan'));
  document.getElementById('btn-identify').addEventListener('click', () => navigate('#identify'));
  document.getElementById('btn-products').addEventListener('click', () => navigate('#products'));
  document.getElementById('btn-settings').addEventListener('click', () => navigate('#settings'));
}
