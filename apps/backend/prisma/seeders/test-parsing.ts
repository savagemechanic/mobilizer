// Test the exact parsing logic from locations-batch.ts

function parseValues(tupleContent: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  let quoteChar = '';

  // Parse values character by character to handle quotes properly
  for (let i = 0; i < tupleContent.length; i++) {
    const char = tupleContent[i];
    const nextChar = tupleContent[i + 1];

    if ((char === "'" || char === '"') && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      // Check for escaped quote
      if (nextChar === quoteChar) {
        currentValue += char;
        i++; // Skip next char
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
  return values.map((v) => {
    v = v.trim();
    // Handle NULL
    if (v.toLowerCase() === 'null') return null;
    // Remove quotes
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      return v.substring(1, v.length - 1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    }
    return v;
  });
}

// Test with sample data
const testTuples = [
  "(1,'ABIA','01')",
  "(2,'ADAMAWA','02')",
  "(3,'AKWA IBOM','03')",
  "(1,1,'ABA NORTH','01')",
  "(2,1,'ABA SOUTH','02')",
];

console.log('Testing value parsing:\n');

testTuples.forEach((tuple, i) => {
  // Remove outer parentheses
  const content = tuple.substring(1, tuple.length - 1);
  const parsed = parseValues(content);
  console.log(`${i + 1}. ${tuple}`);
  console.log(`   Parsed: [${parsed.map(v => v === null ? 'NULL' : `"${v}"`).join(', ')}]`);
  console.log();
});
