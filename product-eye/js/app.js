import { init as initDB, getAllSettings } from './db.js';
import { start as startRouter, register, navigate } from './router.js';
import { render as renderHome } from './pages/home.js';
import { render as renderProductList } from './pages/product-list.js';
import { render as renderProductForm } from './pages/product-form.js';
import { render as renderScanBarcode } from './pages/scan-barcode.js';
import { render as renderIdentifyPhoto } from './pages/identify-photo.js';
import { render as renderResult } from './pages/result.js';

async function boot() {
  try {
    await initDB();

    const settings = await getAllSettings();
    window.__settings = {
      voiceRate: settings.voiceRate ?? 0.9,
      voicePitch: settings.voicePitch ?? 1.0,
      voiceVolume: settings.voiceVolume ?? 1.0,
      confidenceThreshold: settings.confidenceThreshold ?? 0.65,
      modelDownloaded: settings.modelDownloaded ?? false
    };

    register('#home', renderHome);
    register('#products', renderProductList);
    register('#add-product', renderProductForm);
    register('#edit-product', renderProductForm);
    register('#scan', renderScanBarcode);
    register('#identify', renderIdentifyPhoto);
    register('#result', renderResult);
    // Other routes will be added in later phases:
    // register('#settings', ...)

    startRouter();

    // Register Service Worker (non-blocking)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  } catch (err) {
    document.getElementById('app').innerHTML = `
      <div class="page active">
        <div class="page-content">
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <div class="empty-text">应用启动失败</div>
            <div style="font-size:16px;color:#9E9E9E;margin-top:8px;">${err.message}</div>
          </div>
        </div>
      </div>
    `;
    console.error('App init error:', err);
  }
}

document.addEventListener('DOMContentLoaded', boot);
