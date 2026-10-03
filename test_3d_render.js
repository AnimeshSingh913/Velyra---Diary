const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[Browser ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.log(`[Browser PAGE ERROR] ${err.message}`);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const bufferClosed = await page.screenshot();
  fs.writeFileSync('closed_book.png', bufferClosed);

  await page.click('.diary-scene-container canvas');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const bufferOpen = await page.screenshot();
  fs.writeFileSync('open_book.png', bufferOpen);
  
  console.log('Screenshots saved: closed_book.png, open_book.png');
  await browser.close();
})();
