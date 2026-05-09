import { navigate, getParams } from '../router.js';
import { getProduct } from '../db.js';
import { speakProduct, stop as stopTTS } from '../services/tts-service.js';

export async function render(app) {
  const { id, barcode, method, confidence } = getParams();
  const confNum = parseFloat(confidence) || 0;

  app.innerHTML = `
    <div class="page active">
      <div class="page-header">
        <button class="btn-back" id="btn-back">←</button>
        <h1 class="page-title">识别结果</h1>
      </div>
      <div class="page-content" id="result-content">
        <div class="recognizing">
          <div class="recognizing-spinner"></div>
          <div class="recognizing-text">加载中...</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => {
    stopTTS();
    navigate('#home');
  });

  const product = await loadProduct(id);

  const content = document.getElementById('result-content');
  if (!product) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-text">商品未找到</div>
        <button class="btn-primary" id="btn-back-home" style="width:160px;">返回首页</button>
      </div>`;
    document.getElementById('btn-back-home').addEventListener('click', () => navigate('#home'));
    return;
  }

  const confidenceText = confNum >= 0.85 ? '高' : confNum >= 0.65 ? '中' : '低';
  const methodText =
    method === 'barcode' ? '条码扫描' :
    method === 'dhash' ? '快速图像匹配' :
    method === 'mobilenet' ? '智能图像识别' : '';

  content.innerHTML = `
    <div class="result-container">
      <div class="result-name">${product.name}</div>
      <div class="result-price">¥${Number(product.price).toFixed(2)}</div>
      ${barcode ? `<div style="font-size:16px;color:var(--color-disabled);">条码：${barcode}</div>` : ''}
      ${methodText ? `<div class="result-confidence">匹配度：${confidenceText}${confNum ? '（' + (confNum * 100).toFixed(0) + '%）' : ''} · ${methodText}</div>` : ''}
      <div style="margin-top:8px;">
        <button class="btn-secondary" id="btn-speak" style="width:200px;font-size:18px;">🔊 再播一次</button>
      </div>
      <div class="result-actions">
        <button class="btn-primary" id="btn-continue">继续</button>
        <button class="btn-secondary" id="btn-back-home">返回首页</button>
      </div>
    </div>`;

  // Auto-speak
  speakProduct(product.name, product.price);

  document.getElementById('btn-speak').addEventListener('click', () => {
    speakProduct(product.name, product.price);
  });

  document.getElementById('btn-continue').addEventListener('click', () => {
    stopTTS();
    navigate(method === 'barcode' ? '#scan' : '#identify');
  });

  document.getElementById('btn-back-home').addEventListener('click', () => {
    stopTTS();
    navigate('#home');
  });
}

async function loadProduct(id) {
  if (!id) return null;
  try {
    return await getProduct(id);
  } catch (_) {
    return null;
  }
}
