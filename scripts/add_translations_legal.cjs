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
  "contact.preferDirect": {
    es: "¿Prefieres escribirnos directamente?",
    en: "Prefer to write us directly?",
    pt: "Prefere nos escrever diretamente?",
    fr: "Vous préférez nous écrire directement ?",
    de: "Schreiben Sie uns lieber direkt?",
    it: "Preferisci scriverci direttamente?"
  },
  "contact.responseTime": {
    es: "Tiempo estimado de respuesta: 24 a 72 horas",
    en: "Estimated response time: 24 to 72 hours",
    pt: "Tempo estimado de resposta: 24 a 72 horas",
    fr: "Délai de réponse estimé : 24 à 72 heures",
    de: "Geschätzte Reaktionszeit: 24 bis 72 Stunden",
    it: "Tempo di risposta stimato: dalle 24 alle 72 ore"
  }
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
