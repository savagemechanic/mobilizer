import * as fs from 'fs';

const sqlContent = fs.readFileSync('/Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/location_lookups.sql', 'utf-8');

const tableRegex = /INSERT INTO `local_governments`[\s\S]*?VALUES\s*([\s\S]+?)\s*;\s*(?:\n|$)/im;
const match = tableRegex.exec(sqlContent);

if (!match) {
  console.log('No match!');
  process.exit(1);
}

const valuesBlock = match[1];
console.log(`Values block: ${valuesBlock.length} chars\n`);

// Count quotes
let singleQuotes = 0;
let doubleQuotes = 0;

for (const char of valuesBlock) {
  if (char === "'") singleQuotes++;
  if (char === '"') doubleQuotes++;
}

console.log(`Single quotes: ${singleQuotes}`);
console.log(`Double quotes: ${doubleQuotes}`);
console.log(`Single quotes balanced: ${singleQuotes % 2 === 0 ? 'YES' : 'NO'}`);
console.log(`Double quotes balanced: ${doubleQuotes % 2 === 0 ? 'YES' : 'NO'}\n`);

// Simulate quote state tracking
let inQuotes = false;
let quoteChar = '';
let parenCount = 0;
let quoteErrors: string[] = [];

for (let i = 0; i < valuesBlock.length; i++) {
  const char = valuesBlock[i];

  if ((char === "'" || char === '"') && !inQuotes) {
    inQuotes = true;
    quoteChar = char;
  } else if (char === quoteChar && inQuotes) {
    // Check for escaped quote (backslash before)
    if (i > 0 && valuesBlock[i - 1] === '\\') {
      // This is an escaped quote, don't close
      continue;
    }
    inQuotes = false;
    quoteChar = '';
  } else if (char === '(' && !inQuotes) {
    parenCount++;
    if (parenCount <= 5 || parenCount >= 770) {
      // Log first 5 and last 5
      const context = valuesBlock.substring(Math.max(0, i - 20), Math.min(valuesBlock.length, i + 50));
      console.log(`Paren #${parenCount} at pos ${i}: ...${context}...`);
    }
  }
}

if (inQuotes) {
  console.log(`\nWARNING: Ended with unclosed quote!`);
}

console.log(`\nTotal opening parens found: ${parenCount}`);
console.log(`Expected: 774`);
