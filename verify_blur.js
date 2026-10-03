const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Click the canvas to trigger the opening animation
  await page.click('.diary-scene-container canvas');
  
  // Wait 1.5 seconds (halfway through opening)
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const buffer1 = await page.screenshot();
  fs.writeFileSync('test_opening.png', buffer1);

  // Wait 2 more seconds (fully open)
  await new Promise(resolve => setTimeout(resolve, 2000));

  const buffer2 = await page.screenshot();
  fs.writeFileSync('test_open.png', buffer2);
  
  console.log('Screenshots saved: test_opening.png, test_open.png');
  await browser.close();
})();
