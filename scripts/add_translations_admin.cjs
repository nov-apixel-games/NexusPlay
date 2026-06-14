const fs = require('fs');
const path = 'src/i18n/translations.ts';
let data = fs.readFileSync(path, 'utf8');

const startIdx = data.indexOf('{');
const endIdx = data.lastIndexOf('}');
const objStr = data.substring(startIdx, endIdx + 1);

let parsedObj = Function('"use strict";return (' + objStr + ')')();

const newKeys = {
  "admin.noUsers": {
    es: "No hay usuarios registrados o cargando...",
    en: "No registered users or loading...",
    pt: "Nenhum usuário registrado ou carregando...",
    fr: "Aucun utilisateur enregistré ou chargement...",
    de: "Keine registrierten Benutzer oder Laden...",
    it: "Nessun utente registrato o in caricamento..."
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
