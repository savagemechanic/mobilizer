import * as fs from 'fs';

// Copy the exact extractTableData function from the seeder
function extractTableData(sqlContent: string, tableName: string): string[][] {
  const tableRegex = new RegExp(
    `INSERT INTO \`${tableName}\`[\\s\\S]*?VALUES\\s*([\\s\\S]+?)\\s*;\\s*(?:\\n|$)`,
    'gim'
  );

  const matches = Array.from(sqlContent.matchAll(tableRegex));
  if (matches.length === 0) {
    console.log(`No data found for table: ${tableName}`);
    return [];
  }

  console.log(`Found ${matches.length} INSERT statements`);

  const combinedValues = matches.map(m => m[1]).join(',\n');
  const valuesBlock = combinedValues;
  console.log(`Combined values block: ${valuesBlock.length} chars`);
  const rows: string[][] = [];

  let i = 0;
  while (i < valuesBlock.length) {
    while (i < valuesBlock.length && /[\s,]/.test(valuesBlock[i])) {
      i++;
    }

    if (i >= valuesBlock.length) break;

    if (valuesBlock[i] === '(') {
      i++;
      let tupleContent = '';
      let inQuotes = false;
      let quoteChar = '';
      let depth = 1;

      while (i < valuesBlock.length && depth > 0) {
        const char = valuesBlock[i];

        if ((char === "'" || char === '"') && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
          tupleContent += char;
        } else if (char === quoteChar && inQuotes) {
          if (i > 0 && valuesBlock[i - 1] === '\\') {
            tupleContent += char;
          } else {
            inQuotes = false;
            quoteChar = '';
            tupleContent += char;
          }
        } else if (char === '(' && !inQuotes) {
          depth++;
          tupleContent += char;
        } else if (char === ')' && !inQuotes) {
          depth--;
          if (depth > 0) tupleContent += char;
        } else {
          tupleContent += char;
        }

        i++;
      }

      const values: string[] = [];
      let currentValue = '';
      inQuotes = false;
      quoteChar = '';

      for (let j = 0; j < tupleContent.length; j++) {
        const char = tupleContent[j];
        const nextChar = tupleContent[j + 1];

        if ((char === "'" || char === '"') && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
          if (j > 0 && tupleContent[j - 1] === '\\') {
            currentValue += char;
          } else if (nextChar === quoteChar) {
            currentValue += char;
            j++;
          } else {
            inQuotes = false;
            quoteChar = '';
          }
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      if (currentValue.trim()) {
        values.push(currentValue.trim());
      }

      const cleanedValues = values.map((v) => {
        v = v.trim();
        if (v.toLowerCase() === 'null') return null;
        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
          return v.substring(1, v.length - 1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        }
        return v;
      });

      rows.push(cleanedValues as string[]);
    } else {
      i++;
    }
  }

  return rows;
}

// Test
const sqlContent = fs.readFileSync('/Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/location_lookups.sql', 'utf-8');
const puData = extractTableData(sqlContent, 'pu_data');

console.log(`Total rows parsed: ${puData.length}`);

// Count by state (5th column is delim)
const byState = new Map<string, number>();
puData.forEach(row => {
  const delim = row[4];
  if (delim) {
    const state = delim.split('-')[0];
    byState.set(state, (byState.get(state) || 0) + 1);
  }
});

console.log('\nRows by state code:');
[...byState.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([state, count]) => {
  console.log(`  ${state}: ${count}`);
});

// Check specific missing ones
const missingDelims = ['22-17-04-006', '23-01-01-001', '24-01-01-001'];
console.log('\nChecking if missing delims are in parsed data:');
missingDelims.forEach(d => {
  const found = puData.some(row => row[4] === d);
  console.log(`  ${d}: ${found ? 'FOUND' : 'NOT FOUND'}`);
});
