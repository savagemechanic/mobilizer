// Test parsing with actual LGA data

const testData = `(1,1,'ABA NORTH','01'),
(2,1,'ABA SOUTH','02'),
(3,1,'AROCHUKWU','03'),
(42,3,'ESIT EKET (UQUO)','04'),
(292,16,'YALMALTU/ DEBA','11'),
(773,31,'SURULERE','33'),
(774,26,'OBI','11')`;

function extractTuples(valuesBlock: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  let skipped = 0;

  while (i < valuesBlock.length) {
    // Skip whitespace and commas
    while (i < valuesBlock.length && /[\s,]/.test(valuesBlock[i])) {
      i++;
    }

    if (i >= valuesBlock.length) break;

    if (valuesBlock[i] === '(') {
      i++; // Skip opening paren
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
          inQuotes = false;
          quoteChar = '';
          tupleContent += char;
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

      // Parse tuple content into values
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
          if (nextChar === quoteChar) {
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
          return v.substring(1, v.length - 1);
        }
        return v;
      });

      rows.push(cleanedValues);
    } else {
      console.log(`Unexpected char at pos ${i}: '${valuesBlock[i]}' (code: ${valuesBlock.charCodeAt(i)})`);
      skipped++;
      i++;
    }
  }

  console.log(`Parsed ${rows.length} tuples, skipped ${skipped} chars`);
  return rows;
}

console.log('Testing with sample data:\n');
const result = extractTuples(testData);

result.forEach((row, i) => {
  console.log(`${i + 1}. [${row.join(', ')}]`);
});
