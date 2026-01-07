import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Same parser
function extractTableData(sqlContent: string, tableName: string): string[][] {
  const tableRegex = new RegExp(`INSERT INTO \`${tableName}\`[\\s\\S]*?VALUES\\s*([\\s\\S]+?)\\s*;\\s*(?:\\n|$)`, 'gim');
  const matches = Array.from(sqlContent.matchAll(tableRegex));
  const combinedValues = matches.map(m => m[1]).join(',\n');
  const rows: string[][] = [];
  let i = 0;
  while (i < combinedValues.length) {
    while (i < combinedValues.length && /[\s,]/.test(combinedValues[i])) i++;
    if (i >= combinedValues.length) break;
    if (combinedValues[i] === '(') {
      i++;
      let tuple = '', inQ = false, qC = '', d = 1;
      while (i < combinedValues.length && d > 0) {
        const c = combinedValues[i];
        if ((c === "'" || c === '"') && !inQ) { inQ = true; qC = c; tuple += c; }
        else if (c === qC && inQ) { if (i > 0 && combinedValues[i-1] === '\\') tuple += c; else { inQ = false; qC = ''; tuple += c; } }
        else if (c === '(' && !inQ) { d++; tuple += c; }
        else if (c === ')' && !inQ) { d--; if (d > 0) tuple += c; }
        else tuple += c;
        i++;
      }
      const vals: string[] = [];
      let cv = ''; inQ = false; qC = '';
      for (let j = 0; j < tuple.length; j++) {
        const c = tuple[j], n = tuple[j+1];
        if ((c === "'" || c === '"') && !inQ) { inQ = true; qC = c; }
        else if (c === qC && inQ) { if (j > 0 && tuple[j-1] === '\\') cv += c; else if (n === qC) { cv += c; j++; } else { inQ = false; qC = ''; } }
        else if (c === ',' && !inQ) { vals.push(cv.trim()); cv = ''; }
        else cv += c;
      }
      if (cv.trim()) vals.push(cv.trim());
      rows.push(vals.map(v => { v = v.trim(); if (v.toLowerCase() === 'null') return null; if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) return v.slice(1,-1).replace(/\\'/g, "'").replace(/\\\\/g, '\\'); return v; }) as string[]);
    } else i++;
  }
  return rows;
}

async function check() {
  const sqlContent = fs.readFileSync('/Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/location_lookups.sql', 'utf-8');
  const puData = extractTableData(sqlContent, 'pu_data');

  // Get missing delimitations from DB
  const dbDelims = new Set((await prisma.pollingUnit.findMany({ select: { delimitation: true } })).map(d => d.delimitation));

  // Find missing rows for states 22, 23, 24
  const missing22: any[] = [];
  const missing23: any[] = [];
  const missing24: any[] = [];

  puData.forEach((row, idx) => {
    const delim = row[4];
    if (!delim) return;
    if (!dbDelims.has(delim)) {
      const [state] = delim.split('-');
      const data = { idx, delim, name: row[8], puCode: delim.split('-')[3] };
      if (state === '22') missing22.push(data);
      else if (state === '23') missing23.push(data);
      else if (state === '24') missing24.push(data);
    }
  });

  console.log(`Missing from state 22: ${missing22.length}`);
  console.log(`Missing from state 23: ${missing23.length}`);
  console.log(`Missing from state 24: ${missing24.length}`);

  // Check for any pattern - duplicate puCodes within same ward?
  console.log('\nSample missing from state 22:');
  missing22.slice(0, 10).forEach(m => console.log(`  idx ${m.idx}: ${m.delim} - ${m.name?.substring(0, 40)}`));

  console.log('\nSample missing from state 24:');
  missing24.slice(0, 10).forEach(m => console.log(`  idx ${m.idx}: ${m.delim} - ${m.name?.substring(0, 40)}`));

  // Check if any of these have NULL or empty values
  console.log('\nChecking for null/empty values in missing records:');
  const nullDelim = puData.filter((row, idx) => !dbDelims.has(row[4]) && (!row[4] || !row[8])).length;
  console.log(`  Records with null delim or name: ${nullDelim}`);

  await prisma.$disconnect();
}

check();
