import * as fs from 'fs';
import * as path from 'path';

const sqlFilePath = path.join(__dirname, '../../../../apps/location_lookups.sql');

console.log('Reading SQL file...');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
console.log(`File size: ${(sqlContent.length / 1024 / 1024).toFixed(2)} MB\n`);

// Test states extraction
console.log('Testing states extraction...');
const statesRegex = /INSERT INTO `states`[^;]*?VALUES\s*([^;]+);/gis;
const statesMatch = statesRegex.exec(sqlContent);

if (statesMatch) {
  console.log('✓ Found states INSERT statement');
  console.log('Values block length:', statesMatch[1].length);
  console.log('\nFirst 500 chars of values:');
  console.log(statesMatch[1].substring(0, 500));

  // Count tuples
  const tupleMatches = statesMatch[1].match(/\([^)]+\)/g);
  console.log(`\nFound ${tupleMatches?.length || 0} state tuples`);

  if (tupleMatches && tupleMatches.length > 0) {
    console.log('\nFirst 3 tuples:');
    tupleMatches.slice(0, 3).forEach((tuple, i) => {
      console.log(`${i + 1}. ${tuple}`);
    });
  }
} else {
  console.log('✗ Could not find states INSERT statement');

  // Try to find what's there
  console.log('\nSearching for "states" in file...');
  const statesIndex = sqlContent.toLowerCase().indexOf('create table `states`');
  if (statesIndex >= 0) {
    console.log('Found CREATE TABLE at position:', statesIndex);
    console.log('\nContent around states:');
    console.log(sqlContent.substring(statesIndex, statesIndex + 1000));
  }
}

// Test LGAs
console.log('\n\n===========================================');
console.log('Testing local_governments extraction...');
const lgaRegex = /INSERT INTO `local_governments`[^;]*?VALUES\s*([^;]+);/gis;
const lgaMatch = lgaRegex.exec(sqlContent);

if (lgaMatch) {
  console.log('✓ Found local_governments INSERT statement');
  const tupleMatches = lgaMatch[1].match(/\([^)]+\)/g);
  console.log(`Found ${tupleMatches?.length || 0} LGA tuples`);

  if (tupleMatches && tupleMatches.length > 0) {
    console.log('\nFirst 3 tuples:');
    tupleMatches.slice(0, 3).forEach((tuple, i) => {
      console.log(`${i + 1}. ${tuple}`);
    });
  }
} else {
  console.log('✗ Could not find local_governments INSERT statement');
}
