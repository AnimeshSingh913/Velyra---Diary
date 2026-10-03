const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  let hasError = false;
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser ERROR] ${msg.text()}`);
      if (msg.text().includes('THREE.WebGLProgram')) hasError = true;
    }
  });
  page.on('pageerror', err => {
    console.log(`[Browser PAGE ERROR] ${err.message}`);
    hasError = true;
  });

  console.log('Navigating...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  if (hasError) {
    console.log('Test Failed: Errors detected.');
  } else {
    console.log('Test Passed: No WebGL/Shader errors detected.');
  }

  // Set blur progress to 0.6 manually to see if it blows up
  await page.evaluate(() => {
    if (window.diaryScene && window.diaryScene.bgMaterial) {
      window.diaryScene.bgMaterial.uniforms.uBlurProgress.value = 0.6;
      window.diaryScene.renderer.render(window.diaryScene.scene, window.diaryScene.cameraController.camera);
    }
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const bufferOpen = await page.screenshot();
  fs.writeFileSync('shader_test.png', bufferOpen);

  console.log('Screenshot saved: shader_test.png');
  await browser.close();
})();
