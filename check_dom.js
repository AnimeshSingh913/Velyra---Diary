const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  
  // Wait for React to mount
  await page.waitForSelector('.diary-scene-root');

  const data = await page.evaluate(() => {
    const bgImg = document.querySelector('.diary-cinematic-bg');
    const container = document.querySelector('.diary-scene-container canvas');
    
    return {
      bgImg: bgImg ? {
        src: bgImg.src,
        width: bgImg.width,
        height: bgImg.height,
        opacity: getComputedStyle(bgImg).opacity,
        zIndex: getComputedStyle(bgImg).zIndex,
        display: getComputedStyle(bgImg).display
      } : null,
      canvas: container ? {
        bg: getComputedStyle(container).backgroundColor,
        opacity: getComputedStyle(container).opacity,
        zIndex: getComputedStyle(container).zIndex
      } : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      rootBg: getComputedStyle(document.getElementById('root')).backgroundColor,
      appBg: getComputedStyle(document.querySelector('.app-container')).backgroundColor,
      sceneRootBg: getComputedStyle(document.querySelector('.diary-scene-root')).backgroundColor,
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
