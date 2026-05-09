let zxingReader = null;

async function ensureZxing() {
  if (zxingReader) return zxingReader;
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/esm/index.js');
    zxingReader = new mod.BrowserMultiFormatReader();
    return zxingReader;
  } catch (err) {
    throw new Error('条码库加载失败：' + err.message);
  }
}

export function isNativeSupported() {
  return 'BarcodeDetector' in window;
}

async function getNativeDetector() {
  if (!isNativeSupported()) throw new Error('BarcodeDetector 不可用');
  const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];
  return new BarcodeDetector({ formats });
}

export async function scan(videoEl, signal) {
  // Prefer native BarcodeDetector
  if (isNativeSupported()) {
    const detector = await getNativeDetector();
    while (!signal.aborted) {
      try {
        const barcodes = await detector.detect(videoEl);
        if (barcodes.length > 0) {
          return barcodes[0].rawValue;
        }
      } catch (_) {
        // Detection may fail on some frames — continue
      }
      await delay(250);
    }
    return null;
  }

  // Fallback to ZXing
  const reader = await ensureZxing();
  return new Promise((resolve) => {
    reader.decodeFromVideoElement(videoEl, (result, err) => {
      if (signal.aborted) { resolve(null); return; }
      if (result) { resolve(result.getText()); }
    });
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
