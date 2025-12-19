import * as fs from 'fs';
import * as path from 'path';

const sqlFilePath = path.join(__dirname, '../../../../apps/location_lookups.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

console.log('Testing LGA extraction regex...\n');

const tableName = 'local_governments';
const tableRegex = new RegExp(
  `INSERT INTO \`${tableName}\`[^;]*?VALUES\\s*([^;]+);`,
  'gis'
);

const match = tableRegex.exec(sqlContent);

if (match) {
  console.log('Match found!');
  console.log(`Full match length: ${match[0].length} chars`);
  console.log(`Values block (group 1) length: ${match[1].length} chars`);
  console.log(`\nFirst 300 chars of values block:`);
  console.log(match[1].substring(0, 300));
  console.log(`\n...`);
  console.log(`\nLast 300 chars of values block:`);
  console.log(match[1].substring(match[1].length - 300));

  // Count tuples by counting opening parens not inside quotes
  let count = 0;
  let inQuotes = false;
  let quoteChar = '';
  for (let i = 0; i < match[1].length; i++) {
    const char = match[1][i];
    if ((char === "'" || char === '"') && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
    } else if (char === '(' && !inQuotes) {
      count++;
    }
  }
  console.log(`\nEstimated tuple count: ${count}`);
} else {
  console.log('No match found!');
}
