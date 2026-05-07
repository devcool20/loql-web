export const resizeImageFile = (
  file: File,
  options: { maxSize?: number; quality?: number } = {},
): Promise<string> => {
  const maxSize = options.maxSize ?? 1400;
  const quality = options.quality ?? 0.76;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Unable to process image.'));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to prepare image.'));
          return;
        }
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};
