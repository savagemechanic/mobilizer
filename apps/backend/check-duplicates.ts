import * as fs from 'fs';

const sqlContent = fs.readFileSync('/Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/location_lookups.sql', 'utf-8');

// Find pu_data section
const puDataStart = sqlContent.indexOf('INSERT INTO `pu_data`');
if (puDataStart === -1) {
  console.log('pu_data not found');
  process.exit(1);
}

const puDataSection = sqlContent.substring(puDataStart);

// Extract delimitation values (5th column in each row)
const delimRegex = /\(\d+,\s*\d+,\s*\d+,\s*\d+,\s*'([^']+)'/g;
const delims: string[] = [];
let match;

while ((match = delimRegex.exec(puDataSection)) !== null) {
  delims.push(match[1]);
}

console.log('Total rows parsed:', delims.length);

// Find duplicates
const seen = new Map<string, number>();
delims.forEach(d => seen.set(d, (seen.get(d) || 0) + 1));

const duplicates = [...seen.entries()].filter(([k, v]) => v > 1);
const uniqueCount = seen.size;

console.log('Unique delimitations:', uniqueCount);
console.log('Duplicate delimitation entries:', delims.length - uniqueCount);
console.log('Number of delimitations with duplicates:', duplicates.length);

if (duplicates.length > 0) {
  console.log('\nSample duplicates (delim -> count):');
  duplicates.slice(0, 20).forEach(([d, c]) => console.log(`  ${d}: ${c} times`));
}
