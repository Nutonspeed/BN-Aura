const fs = require('fs');
const content = fs.readFileSync('app/[locale]/(dashboard)/admin/network-map/page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let issueFound = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    
    if (char === '(') {
      stack.push({ line: lineNum, char: j, type: '(' });
    } else if (char === ')') {
      if (stack.length === 0) {
        console.log(`Unmatched closing ')' at line ${lineNum}, position ${j}`);
        console.log(`Line content: ${line.trim()}`);
        issueFound = true;
      } else {
        const last = stack.pop();
        if (last.type !== '(') {
          console.log(`Mismatched brackets at line ${lineNum}, position ${j}`);
          console.log(`Expected ${last.type}, got )`);
          issueFound = true;
        }
      }
    } else if (char === '{') {
      stack.push({ line: lineNum, char: j, type: '{' });
    } else if (char === '}') {
      if (stack.length === 0) {
        console.log(`Unmatched closing '}' at line ${lineNum}, position ${j}`);
        console.log(`Line content: ${line.trim()}`);
        issueFound = true;
      } else {
        const last = stack.pop();
        if (last.type !== '{') {
          console.log(`Mismatched brackets at line ${lineNum}, position ${j}`);
          console.log(`Expected ${last.type}, got }`);
          issueFound = true;
        }
      }
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed brackets:');
  stack.forEach(item => {
    console.log(`- ${item.type} at line ${item.line}, position ${item.char}`);
  });
  issueFound = true;
}

if (!issueFound) {
  console.log('No bracket issues found');
}
