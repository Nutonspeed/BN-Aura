/**
 * BN-Aura Image Processing Utility
 * Used for simulating clinical imaging (UV, Polarized) from standard RGB photos.
 */

/**
 * Simulates UV Imaging to highlight hidden pigmentation and sun damage.
 * Technique: Contrast enhancement on the Blue/Green channels where melanin is most visible.
 */
export async function simulateUVImaging(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context not available');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // UV Simulation: Enhance pigmentation by emphasizing blue channel absorption
        // We look for areas with high melanin (which absorb more UV/Blue)
        const intensity = (r + g + b) / 3;
        
        // Enhance dark spots (pigmentation)
        const factor = 1.5;
        let newR = r;
        let newG = g;
        let newB = b;

        if (intensity < 128) {
          // Make dark areas even darker to show hidden spots
          newR = Math.max(0, r - (128 - intensity) * factor);
          newG = Math.max(0, g - (128 - intensity) * factor);
          newB = Math.max(0, b - (128 - intensity) * factor);
        }

        // Apply a slight blue/purple tint to simulate UV lamp effect
        data[i] = newR * 0.8;     // Red
        data[i + 1] = newG * 0.8; // Green
        data[i + 2] = newB * 1.2; // Blue (Increased)
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

/**
 * Enhances Redness (Erythema) to highlight inflammation and sensitive areas.
 */
export async function highlightRedness(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context not available');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Isolate red channel where R >> G and R >> B
        if (r > g * 1.2 && r > b * 1.2) {
          // Amplify redness
          data[i] = Math.min(255, r * 1.5);
          data[i + 1] = g * 0.8;
          data[i + 2] = b * 0.8;
        } else {
          // De-saturate other areas to make redness pop
          const avg = (r + g + b) / 3;
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}
