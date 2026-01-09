import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist', 'assets');

const files = readdirSync(distDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));

console.log('=== Chunk Dependency Analysis ===\n');

// Parse imports from each chunk
const chunkImports = {};

for (const file of files) {
  const content = readFileSync(join(distDir, file), 'utf8');
  // Match static imports at start of file
  const importMatches = content.match(/import\{[^}]+\}from"([^"]+)"/g) || [];
  const imports = importMatches.map(m => {
    const match = m.match(/from"([^"]+)"/);
    return match ? match[1] : null;
  }).filter(Boolean);

  chunkImports[file] = imports;
  console.log(`${file}:`);
  imports.forEach(imp => console.log(`  <- ${imp}`));
  console.log();
}

// Check for circular dependencies between chunks
console.log('=== Checking for Circular Chunk Dependencies ===\n');

function findCircular(chunk, visited = new Set(), path = []) {
  if (visited.has(chunk)) {
    if (path.includes(chunk)) {
      console.log('CIRCULAR:', [...path, chunk].join(' -> '));
      return true;
    }
    return false;
  }

  visited.add(chunk);
  path.push(chunk);

  const imports = chunkImports[chunk] || [];
  for (const imp of imports) {
    const importedChunk = imp.replace('./', '');
    if (chunkImports[importedChunk]) {
      findCircular(importedChunk, new Set(visited), [...path]);
    }
  }
}

for (const chunk of Object.keys(chunkImports)) {
  findCircular(chunk);
}

// Now check what's in the vendor chunk that vendor-ui depends on
console.log('\n=== Analyzing vendor chunk exports used by vendor-ui ===');
const vendorUi = files.find(f => f.startsWith('vendor-ui'));
const vendor = files.find(f => f.startsWith('vendor-') && !f.includes('react') && !f.includes('router') && !f.includes('forms') && !f.includes('ui'));

if (vendorUi && vendor) {
  const vendorContent = readFileSync(join(distDir, vendor), 'utf8');
  const vendorUiContent = readFileSync(join(distDir, vendorUi), 'utf8');

  // What does vendor-ui import from vendor?
  const vendorImportMatch = vendorUiContent.match(/import\{([^}]+)\}from"\.\/vendor-V/);
  if (vendorImportMatch) {
    console.log('\nvendor-ui imports these from vendor:', vendorImportMatch[1]);
  }

  // Check if vendor imports anything from vendor-ui (would be circular)
  const vendorUiImportMatch = vendorContent.match(/import[^;]+vendor-ui[^;]+;/);
  if (vendorUiImportMatch) {
    console.log('\n*** CRITICAL: vendor imports from vendor-ui! ***');
    console.log(vendorUiImportMatch[0]);
  }
}

// Look at the start of vendor chunk to see exports
console.log('\n=== First 500 chars of vendor chunk ===');
if (vendor) {
  const vendorContent = readFileSync(join(distDir, vendor), 'utf8');
  console.log(vendorContent.substring(0, 500));
}
