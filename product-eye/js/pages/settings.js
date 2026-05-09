import { navigate } from '../router.js';
import { getSetting, setSetting } from '../db.js';
import { speak } from '../services/tts-service.js';
import { getAppStats, formatSize } from '../utils/storage-utils.js';

export async function render(app) {
  const settings = window.__settings || {};

  app.innerHTML = `
    <div class="page active">
      <div class="page-header">
        <button class="btn-back" id="btn-back">←</button>
        <h1 class="page-title">设置</h1>
      </div>
      <div class="page-content">
        <div class="settings-group">
          <h2 style="font-size:24px;font-weight:700;margin-bottom:12px;">语音设置</h2>
          <div class="settings-label">
            <span>语速</span>
            <input type="range" id="voice-rate" min="0.5" max="1.5" step="0.1" value="${settings.voiceRate ?? 0.9}">
          </div>
          <div class="settings-label">
            <span>音调</span>
            <input type="range" id="voice-pitch" min="0.5" max="1.5" step="0.1" value="${settings.voicePitch ?? 1.0}">
          </div>
          <div class="settings-label">
            <span>音量</span>
            <input type="range" id="voice-volume" min="0" max="1" step="0.1" value="${settings.voiceVolume ?? 1.0}">
          </div>
          <button class="btn-secondary" id="btn-test-voice" style="margin-top:12px;">试听语音</button>
        </div>

        <div class="settings-group">
          <h2 style="font-size:24px;font-weight:700;margin-bottom:12px;">识别设置</h2>
          <div class="settings-label">
            <span>匹配置信度</span>
            <input type="range" id="confidence-threshold" min="0.5" max="0.9" step="0.05" value="${settings.confidenceThreshold ?? 0.65}">
          </div>
          <div class="settings-label" style="justify-content:space-between;">
            <span>当前阈值</span>
            <span id="threshold-value" style="font-weight:700;color:#1565C0;">${settings.confidenceThreshold ?? 0.65}</span>
          </div>
        </div>

        <div class="settings-group">
          <h2 style="font-size:24px;font-weight:700;margin-bottom:12px;">存储空间</h2>
          <div id="storage-info" style="font-size:18px;color:#9E9E9E;">加载中...</div>
          <button class="btn-secondary" id="btn-refresh-storage" style="margin-top:12px;">刷新</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => navigate('#home'));

  // Voice test
  document.getElementById('btn-test-voice').addEventListener('click', () => {
    const rate = parseFloat(document.getElementById('voice-rate').value);
    const pitch = parseFloat(document.getElementById('voice-pitch').value);
    const volume = parseFloat(document.getElementById('voice-volume').value);
    speak('这是一段测试语音，用于检测当前设置是否合适。', { rate, pitch, volume });
  });

  // Save on change
  ['voice-rate', 'voice-pitch', 'voice-volume'].forEach((id) => {
    document.getElementById(id).addEventListener('change', async (e) => {
      const key = {
        'voice-rate': 'voiceRate',
        'voice-pitch': 'voicePitch',
        'voice-volume': 'voiceVolume'
      }[id];
      const value = parseFloat(e.target.value);
      window.__settings[key] = value;
      await setSetting(key, value);
    });
  });

  // Confidence threshold
  document.getElementById('confidence-threshold').addEventListener('input', (e) => {
    document.getElementById('threshold-value').textContent = e.target.value;
  });
  document.getElementById('confidence-threshold').addEventListener('change', async (e) => {
    const value = parseFloat(e.target.value);
    window.__settings.confidenceThreshold = value;
    await setSetting('confidenceThreshold', value);
  });

  // Storage info
  document.getElementById('btn-refresh-storage').addEventListener('click', loadStorageInfo);
  await loadStorageInfo();
}

async function loadStorageInfo() {
  const el = document.getElementById('storage-info');
  if (!el) return;
  try {
    const stats = await getAppStats();
    el.innerHTML = `
      <div style="margin-bottom:8px;">商品数量：<strong>${stats.productCount}</strong> 个</div>
      <div style="margin-bottom:8px;">图片数量：<strong>${stats.photoCount}</strong> 张</div>
      <div style="margin-bottom:8px;">图片占用：<strong>${formatSize(stats.photoStorage)}</strong></div>
      <div>总使用量：<strong>${formatSize(stats.totalUsage)}</strong> / ${formatSize(stats.quota)}</div>
    `;
  } catch (err) {
    el.textContent = '获取失败';
  }
}
