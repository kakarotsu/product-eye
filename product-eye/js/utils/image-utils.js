/**
 * Compress an image (from File or Blob) to 224×224 WebP.
 * Returns { blob, dataUrl, width, height }.
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const size = 224;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Cover crop: scale to fill, center-crop
      const scale = Math.max(size / img.width, size / img.height);
      const sw = size / scale;
      const sh = size / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('图片转换失败')); return; }
          const dataUrl = canvas.toDataURL('image/webp', 0.8);
          resolve({ blob, dataUrl, width: size, height: size });
        },
        'image/webp',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}

/**
 * Convert a Blob to a base64 data URL string.
 */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('读取失败'));
    reader.readAsDataURL(blob);
  });
}
