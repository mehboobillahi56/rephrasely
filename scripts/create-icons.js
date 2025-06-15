const fs = require('fs');
const path = require('path');

// Create a simple SVG icon that can be converted to different formats
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4ade80;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#22c55e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad1)"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white">R</text>
  <circle cx="400" cy="150" r="30" fill="white" opacity="0.8"/>
  <circle cx="350" cy="120" r="20" fill="white" opacity="0.6"/>
  <circle cx="450" cy="120" r="15" fill="white" opacity="0.4"/>
</svg>`;

// Ensure assets directory exists
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Write SVG file
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), svgIcon);

console.log('✅ Created icon.svg in assets folder');
console.log('📝 To create platform-specific icons:');
console.log('   1. Install ImageMagick: brew install imagemagick');
console.log('   2. Run: npm run create-icons');
console.log('   Or use online converters to create .ico, .icns, and .png files from the SVG');
