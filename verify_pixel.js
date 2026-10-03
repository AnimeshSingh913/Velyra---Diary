const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Get screenshot as Buffer
  const screenshotBuffer = await page.screenshot();
  
  // Save just in case
  fs.writeFileSync('test_screenshot3.png', screenshotBuffer);

  // We can't parse PNG easily in pure node without a library,
  // BUT we can use page.evaluate and a canvas to get a pixel color!
  const color = await page.evaluate(() => {
    return new Promise(resolve => {
      const canvas = document.querySelector('.diary-scene-container canvas');
      if (!canvas) return resolve('No canvas found');
      
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return resolve('No WebGL context');
      
      requestAnimationFrame(() => {
        const pixels = new Uint8Array(4);
        gl.readPixels(10, canvas.height - 10, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        resolve({
          r: pixels[0],
          g: pixels[1],
          b: pixels[2],
          a: pixels[3]
        });
      });
    });
  });

  console.log('Pixel color at (10, 10):', color);
  
  await browser.close();
})();
