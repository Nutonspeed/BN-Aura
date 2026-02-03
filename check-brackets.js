const fs = require('fs');
const content = fs.readFileSync('app/[locale]/(dashboard)/admin/network-map/page.tsx', 'utf8');
const lines = content.split('\n');

let openParens = 0;
let openBraces = 0;
let openBrackets = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let char of line) {
    if (char === '(') openParens++;
    else if (char === ')') openParens--;
    else if (char === '{') openBraces++;
    else if (char === '}') openBraces--;
    else if (char === '[') openBrackets++;
    else if (char === ']') openBrackets--;
  }
  if (openParens < 0 || openBraces < 0 || openBrackets < 0) {
    console.log(`Unmatched closing at line ${i+1}: ${line.trim()}`);
  }
}

console.log(`Final counts: Parens: ${openParens}, Braces: ${openBraces}, Brackets: ${openBrackets}`);
