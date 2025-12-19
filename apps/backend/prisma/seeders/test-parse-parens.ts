// Test parsing tuples with parentheses inside quoted strings

const testData = `
(42,3,'ESIT EKET (UQUO)','04'),
(43,3,'ESSIEN UDIM','05'),
(57,3,'NSIT ATAI','19'),
(58,3,'NSIT IBOM','20')
`;

function extractTuples(valuesBlock: string): string[][] {
  const rows: string[][] = [];

  // Extract tuples by parsing character by character to handle nested parens in quotes
  let i = 0;
  while (i < valuesBlock.length) {
    // Skip whitespace and commas
    while (i < valuesBlock.length && /[\s,]/.test(valuesBlock[i])) {
      i++;
    }

    if (i >= valuesBlock.length) break;

    // Look for opening paren
    if (valuesBlock[i] === '(') {
      i++; // Skip opening paren
      let tupleContent = '';
      let inQuotes = false;
      let quoteChar = '';
      let depth = 1; // Track paren depth

      // Extract everything until we find the matching closing paren
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

      // Now parse the tuple content into values
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
          // Check for escaped quote
          if (nextChar === quoteChar) {
            currentValue += char;
            j++; // Skip next char
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

      // Push the last value
      if (currentValue.trim()) {
        values.push(currentValue.trim());
      }

      // Clean up values
      const cleanedValues = values.map((v) => {
        v = v.trim();
        // Handle NULL
        if (v.toLowerCase() === 'null') return null;
        // Remove quotes
        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
          return v.substring(1, v.length - 1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        }
        return v;
      });

      rows.push(cleanedValues);
    } else {
      i++;
    }
  }

  return rows;
}

console.log('Testing parser with parentheses in strings:\n');

const parsed = extractTuples(testData);

parsed.forEach((row, i) => {
  console.log(`Row ${i + 1}: [${row.map(v => v === null ? 'NULL' : `"${v}"`).join(', ')}]`);
});

console.log(`\nTotal rows parsed: ${parsed.length}`);
