import * as fs from 'fs';

// Same parser as seeder
function extractTableData(sqlContent: string, tableName: string): string[][] {
  const tableRegex = new RegExp(
    `INSERT INTO \`${tableName}\`[\\s\\S]*?VALUES\\s*([\\s\\S]+?)\\s*;\\s*(?:\\n|$)`,
    'gim'
  );

  const matches = Array.from(sqlContent.matchAll(tableRegex));
  const combinedValues = matches.map(m => m[1]).join(',\n');
  const valuesBlock = combinedValues;
  const rows: string[][] = [];

  let i = 0;
  while (i < valuesBlock.length) {
    while (i < valuesBlock.length && /[\s,]/.test(valuesBlock[i])) i++;
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
      if (currentValue.trim()) values.push(currentValue.trim());

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

const sqlContent = fs.readFileSync('/Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/location_lookups.sql', 'utf-8');
const puData = extractTableData(sqlContent, 'pu_data');

console.log('Rows around position 169000:');
for (let idx = 168995; idx < 169010; idx++) {
  const row = puData[idx];
  if (row) {
    console.log(`  ${idx}: delim=${row[4]}, name=${row[8]?.substring(0, 30)}`);
  }
}

console.log('\nFirst rows of missing states:');
const state22Start = puData.findIndex(r => r[4]?.startsWith('22-'));
const state23Start = puData.findIndex(r => r[4]?.startsWith('23-'));
const state24Start = puData.findIndex(r => r[4]?.startsWith('24-'));

console.log(`  State 22 starts at row: ${state22Start}`);
console.log(`  State 23 starts at row: ${state23Start}`);
console.log(`  State 24 starts at row: ${state24Start}`);

// Check last successful insert area
const state21End = puData.filter(r => r[4]?.startsWith('21-')).length;
const cumulative21 = puData.slice(0, state22Start).length;
console.log(`\n  Records before state 22: ${cumulative21}`);
