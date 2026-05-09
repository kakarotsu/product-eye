const DB_NAME = 'product-eye-db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains('products')) {
        const productsStore = database.createObjectStore('products', { keyPath: 'id' });
        productsStore.createIndex('barcode', 'barcode', { unique: true });
        productsStore.createIndex('name', 'name');
        productsStore.createIndex('updatedAt', 'updatedAt');
      }

      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(new Error('数据库打开失败：' + event.target.error.message));
    };
  });
}

let db = null;

export async function init() {
  db = await openDB();
  return db;
}

function getDb() {
  if (!db) throw new Error('数据库尚未初始化');
  return db;
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(request.error?.message || '数据库操作失败'));
  });
}

// ===== Products CRUD =====

export async function addProduct(product) {
  const now = Date.now();
  const record = {
    ...product,
    id: product.id || crypto.randomUUID(),
    createdAt: product.createdAt || now,
    updatedAt: now
  };
  await promisify(getDb().transaction('products', 'readwrite').objectStore('products').add(record));
  return record;
}

export async function getProduct(id) {
  return promisify(getDb().transaction('products', 'readonly').objectStore('products').get(id));
}

export async function getAllProducts() {
  return promisify(getDb().transaction('products', 'readonly').objectStore('products').getAll());
}

export async function updateProduct(product) {
  product.updatedAt = Date.now();
  await promisify(getDb().transaction('products', 'readwrite').objectStore('products').put(product));
  return product;
}

export async function deleteProduct(id) {
  await promisify(getDb().transaction('products', 'readwrite').objectStore('products').delete(id));
}

export async function getProductByBarcode(barcode) {
  if (!barcode) return null;
  return promisify(getDb().transaction('products', 'readonly').objectStore('products').index('barcode').get(barcode));
}

// ===== Settings =====

export async function getSetting(key) {
  const record = await promisify(getDb().transaction('settings', 'readonly').objectStore('settings').get(key));
  return record ? record.value : null;
}

export async function setSetting(key, value) {
  await promisify(getDb().transaction('settings', 'readwrite').objectStore('settings').put({ key, value }));
}

export async function getAllSettings() {
  const all = await promisify(getDb().transaction('settings', 'readonly').objectStore('settings').getAll());
  const map = {};
  for (const { key, value } of all) {
    map[key] = value;
  }
  return map;
}

// ===== Photo helpers =====

export async function updatePhotoHash(productId, photoId, dhash) {
  const product = await getProduct(productId);
  if (!product) return;
  const photo = product.referencePhotos?.find(p => p.id === photoId);
  if (photo) {
    photo.dhash = dhash;
    await updateProduct(product);
  }
}

export async function updatePhotoEmbedding(productId, photoId, embedding) {
  const product = await getProduct(productId);
  if (!product) return;
  const photo = product.referencePhotos?.find(p => p.id === photoId);
  if (photo) {
    photo.embedding = embedding;
    await updateProduct(product);
  }
}

export async function getAllPhotoRecords() {
  const products = await getAllProducts();
  const records = [];
  for (const product of products) {
    if (product.referencePhotos) {
      for (const photo of product.referencePhotos) {
        records.push({
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          photoId: photo.id,
          dhash: photo.dhash,
          embedding: photo.embedding,
          blob: photo.blob
        });
      }
    }
  }
  return records;
}
