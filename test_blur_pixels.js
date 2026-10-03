const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Function to set blur and get pixel color at (10, 10)
  const testBlur = async (blurValue) => {
    return await page.evaluate((val) => {
      return new Promise(resolve => {
        const scene = window.diaryScene;
        if (!scene) return resolve('No scene');
        
        // Manually force blur
        scene.scene.backgroundBlurriness = val;
        scene.renderer.render(scene.scene, scene.cameraController.camera);
        
        requestAnimationFrame(() => {
          const canvas = document.querySelector('.diary-scene-container canvas');
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          const pixels = new Uint8Array(4);
          gl.readPixels(200, canvas.height - 200, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          resolve(`${pixels[0]},${pixels[1]},${pixels[2]},${pixels[3]}`);
        });
      });
    }, blurValue);
  };

  const c0 = await testBlur(0);
  const c3 = await testBlur(0.3);
  const c6 = await testBlur(0.6);

  console.log(`Blur 0.0: ${c0}`);
  console.log(`Blur 0.3: ${c3}`);
  console.log(`Blur 0.6: ${c6}`);
  
  if (c0 === c6 && c0 !== 'No scene') {
    console.log('CONCLUSION: The pixels did NOT change. The blur effect is NOT working.');
  } else {
    console.log('CONCLUSION: The pixels changed. The blur effect is working.');
  }

  await browser.close();
})();
