const fs = require('fs');
const content = fs.readFileSync('app/[locale]/(dashboard)/admin/network-map/page.tsx', 'utf8');

// Find the return statement and analyze its structure
const returnMatch = content.match(/return\s*\(/);
if (returnMatch) {
  const returnStart = returnMatch.index + returnMatch[0].length - 1; // Position of opening parenthesis
  let parenCount = 1;
  let braceCount = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = returnStart + 1; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';
    
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
    } else if (!inString) {
      if (char === '(') {
        parenCount++;
      } else if (char === ')') {
        parenCount--;
        if (parenCount === 0) {
          console.log(`Return statement ends at position ${i}`);
          console.log(`Character at position ${i}: ${char}`);
          console.log(`Context: ${content.substring(Math.max(0, i - 20), i + 20)}`);
          break;
        }
      } else if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
    }
  }
  
  console.log(`Final counts: Parentheses: ${parenCount}, Braces: ${braceCount}`);
} else {
  console.log('No return statement found');
}
