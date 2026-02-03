const fs = require('fs');
const content = fs.readFileSync('app/[locale]/(dashboard)/admin/network-map/page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let issueFound = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Check for JSX expressions
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const nextChar = j < line.length - 1 ? line[j + 1] : '';
    
    // Check for opening JSX expression {
    if (char === '{' && nextChar !== '/') {
      // Look for the matching }
      let found = false;
      let parenCount = 0;
      let braceCount = 1; // We already found the opening {
      
      for (let k = j + 1; k < content.length; k++) {
        const checkChar = content[k];
        if (checkChar === '{') {
          braceCount++;
        } else if (checkChar === '}') {
          braceCount--;
          if (braceCount === 0) {
            found = true;
            break;
          }
        } else if (checkChar === '(') {
          parenCount++;
        } else if (checkChar === ')') {
          parenCount--;
        }
      }
      
      if (!found) {
        console.log(`Unclosed JSX expression starting at line ${lineNum}, position ${j}`);
        console.log(`Line content: ${line.trim()}`);
        issueFound = true;
      }
    }
  }
}

if (!issueFound) {
  console.log('No JSX expression issues found');
}
