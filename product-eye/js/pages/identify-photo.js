import { navigate } from '../router.js';
import { compressImage } from '../utils/image-utils.js';
import { recognize } from '../services/recognition-service.js';

export function render(app) {
  app.innerHTML = `
    <div class="page active">
      <div class="page-header">
        <button class="btn-back" id="btn-back">←</button>
        <h1 class="page-title">拍照识别</h1>
      </div>
      <div class="page-content" id="identify-content">
        <div style="
          flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;
        ">
          <div style="font-size:80px;">📸</div>
          <div style="font-size:var(--font-body);color:var(--color-disabled);text-align:center;">
            对商品拍照<br>自动识别名称和价格
          </div>
          <button class="btn-primary" id="btn-capture" style="width:200px;">拍照</button>
          <input type="file" id="photo-input" accept="image/*" capture="environment" style="display:none">
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => navigate('#home'));
  document.getElementById('btn-capture').addEventListener('click', () => {
    document.getElementById('photo-input').click();
  });
  document.getElementById('photo-input').addEventListener('change', onPhotoSelected);
}

async function onPhotoSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  const content = document.getElementById('identify-content');
  content.innerHTML = `
    <div class="recognizing">
      <div class="recognizing-spinner"></div>
      <div class="recognizing-text">正在识别...</div>
      <div style="font-size:16px;color:var(--color-disabled);" id="progress-text"></div>
      <div class="progress-bar" style="width:240px;margin-top:8px;">
        <div class="progress-fill" id="progress-fill" style="width:0%;"></div>
      </div>
    </div>
  `;

  try {
    // Compress
    updateProgress(0.05, '正在压缩图片...');
    const compressed = await compressImage(file);

    // Load compressed image for recognition
    const img = await loadImage(compressed.dataUrl);

    // Recognize
    const result = await recognize(img, {
      minConfidence: window.__settings?.confidenceThreshold ?? 0.5,
      onProgress: updateProgress
    });

    showResult(content, compressed.dataUrl, result);
  } catch (err) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-text">识别失败</div>
        <div style="font-size:16px;color:var(--color-disabled);">${err.message}</div>
        <button class="btn-primary" id="btn-retry" style="width:160px;">重试</button>
      </div>`;
    document.getElementById('btn-retry').addEventListener('click', () => {
      render(document.getElementById('app'));
    });
  }
}

function showResult(content, photoUrl, result) {
  const { product, confidence, method } = result;

  if (!product) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-text">未识别出商品</div>
        <div style="font-size:16px;color:var(--color-disabled);">
          请确保商品已录入参考图片
        </div>
        <button class="btn-primary" id="btn-retry" style="width:160px;">重新拍照</button>
        <button class="btn-secondary" id="btn-add" style="width:160px;">添加商品</button>
      </div>`;
    document.getElementById('btn-retry').addEventListener('click', () => {
      render(document.getElementById('app'));
    });
    document.getElementById('btn-add').addEventListener('click', () => {
      navigate('#add-product');
    });
    return;
  }

  navigate(`#result?id=${product.id}&method=${method}&confidence=${confidence.toFixed(2)}`);
}

function updateProgress(value, text) {
  const fill = document.getElementById('progress-fill');
  const textEl = document.getElementById('progress-text');
  if (fill) fill.style.width = (value * 100) + '%';
  if (textEl) textEl.textContent = text;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}
