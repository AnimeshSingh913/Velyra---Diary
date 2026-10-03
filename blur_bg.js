const Jimp = require('jimp');

async function processImage() {
  try {
    const img = await Jimp.read('src/renderer/assets/moonlit_enchanted_study.png');
    // Jimp's blur algorithm can be slow for high radius.
    // 30 is a decent radius for "moderate blur level".
    img.blur(30);
    await img.writeAsync('src/renderer/assets/moonlit_enchanted_study_blurred.png');
    console.log('Successfully generated blurred background.');
  } catch (err) {
    console.error('Error generating blurred background:', err);
  }
}

processImage();
