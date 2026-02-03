const fs = require('fs');
const content = fs.readFileSync('app/[locale]/(dashboard)/admin/network-map/page.tsx', 'utf8');

// Check for common syntax issues
const issues = [];

// Check for unmatched quotes
let inString = false;
let stringChar = '';
let stringStart = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const prevChar = i > 0 ? content[i-1] : '';
  
  if (!inString && (char === '"' || char === "'" || char === '`')) {
    inString = true;
    stringChar = char;
    stringStart = i;
  } else if (inString && char === stringChar && prevChar !== '\\') {
    inString = false;
  }
}

if (inString) {
  issues.push(`Unclosed string starting at position ${stringStart} with character ${stringChar}`);
}

// Check for JSX issues
const jsxRegex = /<[^>]*>/g;
const matches = content.match(jsxRegex);
if (matches) {
  for (const match of matches) {
    if (!match.endsWith('/>') && !match.startsWith('</')) {
      const tagName = match.match(/<(\w+)/);
      if (tagName) {
        const closingTag = `</${tagName[1]}>`;
        if (!content.includes(closingTag)) {
          issues.push(`Unclosed JSX tag: ${tagName[1]}`);
        }
      }
    }
  }
}

console.log('Issues found:');
if (issues.length === 0) {
  console.log('No obvious syntax issues found');
} else {
  issues.forEach(issue => console.log(`- ${issue}`));
}
