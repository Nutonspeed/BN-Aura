const fs = require('fs');
const path = require('path');

const replacements = [
  // Fix remaining errors
  ['DownloadSimple', 'Download'],
  ['WifiHigh', 'Wifi'],
  ['LayoutGrid', 'SquaresFour'],
  ['Sparkles', 'Sparkle'],
  ['CalendarDotsIcon', 'CalendarDots'],
  ['TrendingUp', 'TrendUp'],
  ['Calendar', 'CalendarDots'],
  ['RotateCcw', 'ArrowCounterClockwise'],
  ['Send', 'PaperPlaneTilt'],
  ['MessageCircle', 'ChatCircle'],
  ['ShieldX', 'ShieldSlash'],
  ['Upload', 'UploadSimple'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [from, to] of replacements) {
    // Match whole word only to avoid partial replacements
    const regex = new RegExp(`\\b${from}\\b`, 'g');
    if (regex.test(content)) {
      content = content.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx')) {
      processFile(filePath);
    }
  }
}

walkDir('./app');
walkDir('./components');
console.log('Done!');
