import { getAllPhotoRecords } from '../db.js';

const WARN_THRESHOLD = 0.85; // Warn when 85% full

export async function getStorageInfo() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return { usage: 0, quota: 0, percent: 0, supported: false };
  }
  const { usage, quota } = await navigator.storage.estimate();
  return {
    usage,
    quota,
    percent: quota > 0 ? usage / quota : 0,
    supported: true
  };
}

export async function isStorageLow() {
  const info = await getStorageInfo();
  return info.supported && info.percent >= WARN_THRESHOLD;
}

export async function getAppStats() {
  const records = await getAllPhotoRecords();
  const info = await getStorageInfo();

  let totalBlobSize = 0;
  for (const rec of records) {
    if (rec.blob) totalBlobSize += rec.blob.size;
  }

  return {
    productCount: (await import('../db.js').then((m) => m.getAllProducts())).length,
    photoCount: records.length,
    photoStorage: totalBlobSize,
    totalUsage: info.usage,
    quota: info.quota,
    percent: info.percent
  };
}

export function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
