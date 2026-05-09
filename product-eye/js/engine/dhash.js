/**
 * Perceptual hash (dHash) for image comparison.
 * Produces a 64-bit hash — differences measured with Hamming distance.
 */

const SIZE = 8;

/**
 * Compute dHash hex string from an Image element or data URL.
 */
export function hashFromImage(img) {
  const pixels = getGrayscalePixels(img, SIZE + 1, SIZE);
  return pixelsToHex(pixels);
}

/**
 * Compute dHash from raw pixel data (size+1 × size grayscale array).
 */
export function hashFromPixels(pixels) {
  return pixelsToHex(pixels);
}

/**
 * Get grayscale pixels from an image at target dimensions.
 */
function getGrayscalePixels(img, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // sRGB luminance
      pixels.push(0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2]);
    }
  }
  return pixels;
}

function pixelsToHex(pixels) {
  let hash = 0n;
  for (let y = 0; y < SIZE; y++) {
    const rowStart = y * (SIZE + 1);
    for (let x = 0; x < SIZE; x++) {
      if (pixels[rowStart + x] < pixels[rowStart + x + 1]) {
        hash |= 1n << BigInt(y * SIZE + x);
      }
    }
  }
  return hash.toString(16).padStart(16, '0');
}

/**
 * Hamming distance between two hex dHash strings.
 */
export function hammingDistance(hashA, hashB) {
  if (!hashA || !hashB) return 64;
  const a = BigInt('0x' + hashA);
  const b = BigInt('0x' + hashB);
  let xor = a ^ b;
  let dist = 0;
  while (xor > 0n) {
    dist++;
    xor &= xor - 1n;
  }
  return dist;
}

/**
 * Convert hamming distance (0-64) to confidence score (0-1).
 */
export function dhConfidence(distance) {
  return Math.max(0, 1 - distance / 32);
}
