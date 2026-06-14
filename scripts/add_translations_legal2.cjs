const fs = require('fs');

const path = 'src/i18n/translations.ts';
let data = fs.readFileSync(path, 'utf8');

const startIdx = data.indexOf('{');
const endIdx = data.lastIndexOf('}');
const objStr = data.substring(startIdx, endIdx + 1);

let parsedObj;
try {
  parsedObj = Function('"use strict";return (' + objStr + ')')();
} catch (e) {
  process.exit(1);
}

const newKeys = {
  "legal.lastUpdate": { es: "Última actualización: ", en: "Last update: ", pt: "Última atualização: ", fr: "Dernière mise à jour : ", de: "Letztes Update: ", it: "Ultimo aggiornamento: " }
};

for (const [lang, translations] of Object.entries(parsedObj)) {
  for (const [key, values] of Object.entries(newKeys)) {
    if (values[lang]) {
      translations[key] = values[lang];
    } else {
      translations[key] = values['es'];
    }
  }
}

const newContent = `export const translations: Record<string, Record<string, string>> = ${JSON.stringify(parsedObj, null, 2)};\n\nexport type LanguageCode = keyof typeof translations;\nexport type TranslationKey = keyof typeof translations.es;\n`;

fs.writeFileSync(path, newContent, 'utf8');
