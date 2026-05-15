// 轻量 pHash：把图缩成 32x32 灰度，对 8x8 取均值哈希。
export async function computeImageHash(input: string): Promise<string | null> {
  try {
    const dataUrl = input.startsWith('data:') ? input : `data:image/jpeg;base64,${input}`;
    const img = await loadImage(dataUrl);

    const SIZE = 32;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, SIZE, SIZE);

    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
    const gray = new Float32Array(SIZE * SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const SMALL = 8;
    const block = SIZE / SMALL;
    const small = new Float32Array(SMALL * SMALL);
    let total = 0;
    for (let y = 0; y < SMALL; y++) {
      for (let x = 0; x < SMALL; x++) {
        let sum = 0;
        for (let by = 0; by < block; by++) {
          for (let bx = 0; bx < block; bx++) {
            sum += gray[(y * block + by) * SIZE + (x * block + bx)];
          }
        }
        const v = sum / (block * block);
        small[y * SMALL + x] = v;
        total += v;
      }
    }
    const avg = total / (SMALL * SMALL);

    let bits = '';
    for (let i = 0; i < SMALL * SMALL; i++) {
      bits += small[i] >= avg ? '1' : '0';
    }
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex;
  } catch (e) {
    console.warn('[imageHash] failed:', e);
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
