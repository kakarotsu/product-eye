import { hashFromImage, hammingDistance, dhConfidence } from '../engine/dhash.js';
import { cosineSimilarity } from '../engine/similarity.js';
import { loadModel, isLoaded, extractEmbedding } from '../engine/mobilenet-engine.js';
import { getAllPhotoRecords, updatePhotoHash, updatePhotoEmbedding } from '../db.js';

/**
 * Run full recognition pipeline against a query image.
 *
 * Strategy:
 *  1. Compute dHash of query image (instant, always available)
 *  2. Compare against all stored photo dHashes
 *  3. If top dHash match ≥ HIGH threshold → return immediately
 *  4. Otherwise, load MobileNet (lazy) and compare embeddings
 *  5. Return best match with confidence score
 */
export async function recognize(queryImg, options = {}) {
  const onProgress = options.onProgress || (() => {});
  const minConfidence = options.minConfidence ?? 0.5;

  // Step 1: Compute query dHash
  onProgress(0.05, '正在分析图片特征...');
  const queryHash = hashFromImage(queryImg);

  // Step 2: Get all reference photos
  const records = await getAllPhotoRecords();

  // Compute hash for photos that don't have one yet
  let hashTasks = [];
  for (const rec of records) {
    if (!rec.dhash && rec.blob) {
      hashTasks.push(computeAndStoreHash(rec));
    }
  }
  if (hashTasks.length > 0) {
    onProgress(0.1, '正在计算参考图特征...');
    await Promise.all(hashTasks);
  }

  if (records.length === 0) {
    return { product: null, confidence: 0, method: 'none' };
  }

  // Step 3: dHash comparison
  onProgress(0.15, '正在比对图片...');
  let bestByHash = null;
  let bestHashDist = 64;

  for (const rec of records) {
    if (!rec.dhash) continue;
    const dist = hammingDistance(queryHash, rec.dhash);
    if (dist < bestHashDist) {
      bestHashDist = dist;
      bestByHash = rec;
    }
  }

  // If good dHash match, return immediately
  const hashConfidence = dhConfidence(bestHashDist);
  if (hashConfidence >= 0.7) {
    return {
      product: {
        id: bestByHash.productId,
        name: bestByHash.productName,
        price: bestByHash.productPrice
      },
      confidence: hashConfidence,
      method: 'dhash'
    };
  }

  // Step 4: Try MobileNet for better accuracy
  try {
    onProgress(0.2, '正在加载识别模型...');
    await loadModel((p) => onProgress(0.2 + p * 0.5, '正在加载识别模型...'));

    onProgress(0.7, '正在提取特征...');
    const queryEmbedding = await extractEmbedding(queryImg);

    onProgress(0.8, '正在比对图片...');
    let bestByEmbedding = null;
    let bestSim = 0;

    for (const rec of records) {
      if (!rec.embedding) continue;
      const sim = cosineSimilarity(queryEmbedding, rec.embedding);
      if (sim > bestSim) {
        bestSim = sim;
        bestByEmbedding = rec;
      }
    }

    // Compute embeddings for photos missing them
    const missingEmbeddings = records.filter((r) => !r.embedding && r.blob && r.productId);
    if (missingEmbeddings.length > 0) {
      onProgress(0.85, '正在补充参考数据...');
      for (const rec of missingEmbeddings.slice(0, 3)) {
        try {
          const img = await blobToImage(rec.blob);
          const emb = await extractEmbedding(img);
          await updatePhotoEmbedding(rec.productId, rec.photoId, emb);
          rec.embedding = emb;
          const sim = cosineSimilarity(queryEmbedding, emb);
          if (sim > bestSim) {
            bestSim = sim;
            bestByEmbedding = rec;
          }
        } catch (_) { /* skip problematic photos */ }
      }
    }

    if (bestByEmbedding && bestSim >= minConfidence) {
      return {
        product: {
          id: bestByEmbedding.productId,
          name: bestByEmbedding.productName,
          price: bestByEmbedding.productPrice
        },
        confidence: bestSim,
        method: 'mobilenet'
      };
    }

    // If dHash was borderline and embedding didn't help, return best dHash match
    if (bestByHash && hashConfidence >= 0.3) {
      return {
        product: {
          id: bestByHash.productId,
          name: bestByHash.productName,
          price: bestByHash.productPrice
        },
        confidence: hashConfidence,
        method: 'dhash'
      };
    }
  } catch (err) {
    console.warn('MobileNet recognition failed, falling back to dHash:', err.message);
    // Fall through to dHash result
  }

  // Step 5: Return best available result or no match
  if (bestByHash && hashConfidence >= 0.2) {
    return {
      product: {
        id: bestByHash.productId,
        name: bestByHash.productName,
        price: bestByHash.productPrice
      },
      confidence: hashConfidence,
      method: 'dhash'
    };
  }

  return { product: null, confidence: 0, method: 'none' };
}

async function computeAndStoreHash(rec) {
  try {
    const img = await blobToImage(rec.blob);
    const hash = hashFromImage(img);
    await updatePhotoHash(rec.productId, rec.photoId, hash);
    rec.dhash = hash;
  } catch (_) { /* skip */ }
}

function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(blob);
  });
}
