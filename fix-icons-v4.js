const fs = require('fs');
const path = require('path');

const replacements = [
  // Fix remaining errors - specific patterns
  ['<Download', '<DownloadSimple'],
  ['<Wifi', '<WifiHigh'],
  ['<LogOut', '<SignOut'],
  ['<Building', '<Buildings'],
  ['SmileyyMeh', 'SmileyMeh'],
  ['SmileyyXEyes', 'SmileyXEyes'],
  ['<FileSpreadsheet', '<FileXls'],
  ['<FileJson', '<FileJs'],
  ['<Banknote', '<Money'],
  ['<Layers', '<Stack'],
  ['<SmilePlus', '<SmileyWink'],
  ['<Frown', '<SmileyXEyes'],
  ['<Meh', '<SmileyMeh'],
  ['<Gear2', '<GearSix'],
  ['<ArrowUpCircle', '<ArrowCircleUp'],
  ['<ArrowDownCircle', '<ArrowCircleDown'],
  ['<Settings2', '<GearSix'],
  ['<Languages', '<Translate'],
  ['<ListTodo', '<ListChecks'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
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
