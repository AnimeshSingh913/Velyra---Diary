const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const assetDir = path.join(__dirname, 'src/renderer/assets');
  const imagePath = path.join(assetDir, 'diary_background.png');
  const outPath = path.join(assetDir, 'diary_background_blurred.png');

  // Read image as base64
  const imgBase64 = fs.readFileSync(imagePath).toString('base64');
  const dataUrl = `data:image/png;base64,${imgBase64}`;

  const blurredBase64 = await page.evaluate(async (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Apply 12px blur
        ctx.filter = 'blur(12px)';
        
        // To prevent blur from creating a transparent border, scale slightly and draw
        ctx.drawImage(img, -12, -12, img.width + 24, img.height + 24);
        
        // Extract base64
        resolve(canvas.toDataURL('image/png').split(',')[1]);
      };
      img.onerror = reject;
      img.src = src;
    });
  }, dataUrl);

  fs.writeFileSync(outPath, Buffer.from(blurredBase64, 'base64'));
  console.log('Successfully generated diary_background_blurred.png');
  
  await browser.close();
})();
