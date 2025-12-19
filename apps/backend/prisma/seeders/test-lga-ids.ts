import * as fs from 'fs';

const sqlContent = fs.readFileSync('/Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/location_lookups.sql', 'utf-8');

const tableRegex = /INSERT INTO `local_governments`[\s\S]*?VALUES\s*([\s\S]+?)\s*;\s*(?:\n|$)/im;
const match = tableRegex.exec(sqlContent);

if (!match) {
  console.log('No match!');
  process.exit(1);
}

const valuesBlock = match[1];
console.log(`Values block: ${valuesBlock.length} chars`);

// Count actual opening parens
let parenCount = 0;
let inQuotes = false;
let quoteChar = '';

for (let i = 0; i < valuesBlock.length; i++) {
  const char = valuesBlock[i];
  if ((char === "'" || char === '"') && !inQuotes) {
    inQuotes = true;
    quoteChar = char;
  } else if (char === quoteChar && inQuotes) {
    inQuotes = false;
  } else if (char === '(' && !inQuotes) {
    parenCount++;
  }
}

console.log(`Opening parens (tuples): ${parenCount}`);

// Now extract all tuple IDs using simple regex
const idRegex = /\((\d+),/g;
let idMatch;
const ids: number[] = [];

while ((idMatch = idRegex.exec(valuesBlock)) !== null) {
  ids.push(parseInt(idMatch[1]));
}

console.log(`Regex matched IDs: ${ids.length}`);
console.log(`First 10 IDs: ${ids.slice(0, 10).join(', ')}`);
console.log(`Last 10 IDs: ${ids.slice(-10).join(', ')}`);

// Check for gaps
const missing: number[] = [];
for (let i = 1; i <= 774; i++) {
  if (!ids.includes(i)) {
    missing.push(i);
  }
}

if (missing.length > 0) {
  console.log(`\nMissing IDs (first 20): ${missing.slice(0, 20).join(', ')}`);
  console.log(`Total missing: ${missing.length}`);
} else {
  console.log('\n All IDs 1-774 present!');
}
