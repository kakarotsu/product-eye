import { navigate } from '../router.js';
import { start as startCam, stop as stopCam } from '../services/camera-service.js';
import { scan, isNativeSupported } from '../services/barcode-service.js';
import { getProductByBarcode } from '../db.js';

let stream = null;
let abortCtrl = null;

export async function render(app) {
  app.innerHTML = `
    <div class="page active">
      <div class="scan-container">
        <video id="scanner-video" autoplay playsinline muted></video>
        <div class="scanner-overlay">
          <div class="scanner-frame">
            <div class="scanner-hint">将条码对准框内</div>
          </div>
        </div>
        <button id="btn-close-scan" style="
          position:absolute;top:16px;left:16px;width:60px;height:60px;font-size:28px;
          background:rgba(0,0,0,0.45);color:#fff;border:none;border-radius:50%;
          display:flex;align-items:center;justify-content:center;z-index:10;cursor:pointer;
        ">←</button>
        <div id="scan-status" style="
          position:absolute;bottom:40px;left:24px;right:24px;text-align:center;
          color:#fff;font-size:18px;text-shadow:0 1px 4px rgba(0,0,0,0.8);z-index:10;
        ">${isNativeSupported() ? '📷 将条码放入框内自动识别' : '📷 正在加载识别引擎...'}</div>
      </div>
      <div id="scan-result" style="display:none;padding:16px;"></div>
    </div>
  `;

  document.getElementById('btn-close-scan').addEventListener('click', () => {
    abortCtrl.abort();
    stopCam(stream);
    navigate('#home');
  });

  await initScan();
}

async function initScan() {
  const video = document.getElementById('scanner-video');
  abortCtrl = new AbortController();

  try {
    stream = await startCam(video, 'environment');
    document.getElementById('scan-status').textContent = '📷 将条码放入框内自动识别';

    const barcode = await scan(video, abortCtrl.signal);

    if (barcode) {
      stopCam(stream);
      showResult(barcode);
    }
  } catch (err) {
    document.getElementById('scan-status').textContent = '⚠️ 相机启动失败：' + err.message;
  }
}

async function showResult(barcode) {
  // Hide scanner UI
  const container = document.querySelector('.scan-container');
  if (container) container.style.display = 'none';

  const resultEl = document.getElementById('scan-result');
  resultEl.style.display = 'block';

  let product;
  try {
    product = await getProductByBarcode(barcode);
  } catch (_) {}

  if (product) {
    stopCam(stream);
    navigate(`#result?id=${product.id}&barcode=${barcode}&method=barcode&confidence=1`);
    return;
  }

  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="page-content" style="align-items:center;justify-content:center;text-align:center;">
      <div style="font-size:72px;">🔍</div>
      <div class="result-name" style="font-size:24px;">未找到此条码的商品</div>
      <div style="font-size:16px;color:var(--color-disabled);margin-top:8px;">条码：${barcode}</div>
      <div class="result-actions">
        <button class="btn-primary" id="btn-add-with-barcode">添加此条码商品</button>
        <button class="btn-secondary" id="btn-scan-again">继续扫描</button>
      </div>
    </div>`;

  document.getElementById('btn-scan-again').addEventListener('click', () => {
    render(document.getElementById('app'));
  });

  document.getElementById('btn-add-with-barcode').addEventListener('click', () => {
    navigate(`#add-product?barcode=${barcode}`);
  });
}
