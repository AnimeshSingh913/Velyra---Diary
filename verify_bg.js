const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log(`[Browser LOG] ${msg.text()}`);
  });
  page.on('response', response => {
    if (response.status() === 404) {
      console.log(`[404 NOT FOUND] ${response.url()}`);
    }
  });
  page.on('pageerror', err => {
    console.log(`[Browser PAGE ERROR] ${err.message}`);
  });

  console.log('Navigating to localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
})();
