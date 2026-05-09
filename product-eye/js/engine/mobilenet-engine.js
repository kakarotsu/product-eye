let model = null;
let loading = false;
let loadPromise = null;

/**
 * Load MobileNet model from TF.js CDN. Lazy-loaded on first use.
 */
export async function loadModel(onProgress) {
  if (model) return model;
  if (loading) return loadPromise;

  loading = true;
  loadPromise = doLoad(onProgress);
  return loadPromise;
}

async function doLoad(onProgress) {
  try {
    if (!window.tf) {
      if (onProgress) onProgress(0.1);
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
    }

    if (!window.mobilenet) {
      if (onProgress) onProgress(0.3);
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
    }

    if (onProgress) onProgress(0.5);

    await window.tf.ready();
    model = await window.mobilenet.load({ version: 2, alpha: 0.5 });

    if (onProgress) onProgress(1.0);
    return model;
  } catch (err) {
    loading = false;
    loadPromise = null;
    throw new Error('识别模型加载失败：' + err.message);
  }
}

export function isLoaded() {
  return !!model;
}

/**
 * Extract embedding vector from an image element.
 */
export async function extractEmbedding(img) {
  if (!model) throw new Error('模型未加载');
  const tf = window.tf;
  const tensor = tf.browser.fromPixels(img).resizeNearestNeighbor([224, 224]).toFloat().expandDims();
  const embedding = model.infer(tensor, true);
  const values = Array.from(await embedding.data());
  tf.dispose([tensor, embedding]);
  return values;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('加载失败: ' + src));
    document.head.appendChild(script);
  });
}

/**
 * Get storage size estimate for the model cache.
 */
export function getModelSize() {
  return '~3.5MB (自动缓存)';
}
