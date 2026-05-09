let zxingReader = null;
let zxingLoading = false;

async function ensureZxing(onStatus) {
  if (zxingReader) return zxingReader;
  if (zxingLoading) {
    // Wait for existing load attempt
    for (let i = 0; i < 50; i++) {
      if (zxingReader) return zxingReader;
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error('条码库加载超时');
  }
  zxingLoading = true;
  try {
    if (onStatus) onStatus('正在加载条码识别引擎...');
    const mod = await import('https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/esm/index.js');
    zxingReader = new mod.BrowserMultiFormatReader();
    return zxingReader;
  } catch (err) {
    zxingLoading = false;
    throw new Error('条码库加载失败：' + err.message);
  }
}

export function isNativeSupported() {
  return 'BarcodeDetector' in window;
}

async function getNativeDetector() {
  const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];
  return new BarcodeDetector({ formats });
}

export async function scan(videoEl, signal, onStatus) {
  const NATIVE_TIMEOUT = 8000;

  // Try native BarcodeDetector first (fast, no download)
  if (isNativeSupported()) {
    try {
      const detector = await getNativeDetector();
      if (onStatus) onStatus('📷 将条码放入框内自动识别');

      const startTime = Date.now();
      let failCount = 0;

      while (!signal.aborted) {
        try {
          const barcodes = await detector.detect(videoEl);
          failCount = 0;
          if (barcodes.length > 0) {
            return barcodes[0].rawValue;
          }
        } catch (_) {
          failCount++;
          // If native API keeps failing, fall back to ZXing
          if (failCount > 10) {
            if (onStatus) onStatus('正在切换识别引擎...');
            break;
          }
        }

        // Timeout — fall back to ZXing
        if (Date.now() - startTime > NATIVE_TIMEOUT) {
          if (onStatus) onStatus('正在加载备用识别引擎...');
          break;
        }

        await delay(250);
      }

      if (signal.aborted) return null;
    } catch (_) {
      // Native detector creation failed, fall through to ZXing
    }
  }

  // ZXing fallback
  if (signal.aborted) return null;
  const reader = await ensureZxing(onStatus);
  if (signal.aborted) return null;
  if (onStatus) onStatus('📷 将条码放入框内自动识别');

  return new Promise((resolve) => {
    reader.decodeFromVideoElement(videoEl, (result, err) => {
      if (signal.aborted) { resolve(null); return; }
      if (result) { resolve(result.getText()); }
      // ZXing errors on non-barcode frames are normal — ignore
    });
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
