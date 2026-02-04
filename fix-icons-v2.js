const fs = require('fs');
const path = require('path');

const replacements = [
  // Fix double replacements
  ['CalendarDotsDots', 'CalendarDots'],
  ['ChvvrononRight', 'CaretRight'],
  ['CheveononRight', 'CaretRight'],
  
  // Fix remaining icon names in JSX
  ['BarChart3', 'ChartBar'],
  ['DollarSign', 'CurrencyDollar'],
  ['Building2', 'Buildings'],
  ['MessageSquare', 'ChatCircle'],
  ['AlertCircle', 'WarningCircle'],
  ['AlertTriangle', 'Warning'],
  ['Activity', 'Pulse'],
  ['Zap', 'Lightning'],
  ['Mail', 'EnvelopeSimple'],
  ['Edit', 'PencilSimple'],
  ['Smartphone', 'DeviceMobile'],
  ['Wifi', 'WifiHigh'],
  ['Download', 'DownloadSimple'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [from, to] of replacements) {
    const regex = new RegExp(from, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, to);
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
