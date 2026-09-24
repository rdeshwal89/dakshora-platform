import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('src/erpApp.js', 'utf8');
const regex = /supabase\.from\(['"]([a-zA-Z0-9_\-]+)['"]\)/g;
const tables = new Set();
let match;
while ((match = regex.exec(content)) !== null) {
  tables.add(match[1]);
}
console.log('--- All Supabase tables directly queried in erpApp.js ---');
console.log(Array.from(tables).sort());

// Also find all in-memory arrays like const ERP_... = [
const erpArrayRegex = /const (ERP_[A-Z0-9_]+)\s*=/g;
const erpArrays = new Set();
while ((match = erpArrayRegex.exec(content)) !== null) {
  erpArrays.add(match[1]);
}
console.log('\n--- All in-memory ERP arrays in erpApp.js ---');
console.log(Array.from(erpArrays).sort());
