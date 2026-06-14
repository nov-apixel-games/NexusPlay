const fs = require('fs');

const data = fs.readFileSync('src/i18n/translations.ts', 'utf8');

// The file looks like:
// export const translations: Record<string, Record<string, string>> = { ... };

// Let's extract the object part.
const startIdx = data.indexOf('{');
const endIdx = data.lastIndexOf('}');
const objStr = data.substring(startIdx, endIdx + 1);

// We evaluate the object string in an environment where duplicate keys are allowed.
// But wait, objStr might have references or things not defined? No, it's just a JSON-like object representing strings.
let parsedObj;
try {
  parsedObj = Function('"use strict";return (' + objStr + ')')();
} catch (e) {
  console.error("Error evaluating object string:", e);
  process.exit(1);
}

// parsedObj now has duplicate keys resolved (the last one wins).
// Now let's format it back into a valid TS file.
const newContent = `export const translations: Record<string, Record<string, string>> = ${JSON.stringify(parsedObj, null, 2)};\n`;

fs.writeFileSync('src/i18n/translations.ts', newContent, 'utf8');
console.log("Successfully fixed translations.ts duplicates!");
