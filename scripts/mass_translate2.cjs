const fs = require('fs');

const updateTranslations = (newKeysES, newKeysEN) => {
  const path = 'src/i18n/translations.ts';
  let code = fs.readFileSync(path, 'utf8');

  // Insert ES keys
  const keysStrES = Object.entries(newKeysES).map(([k, v]) => `    "${k}": "${v}",`).join('\n');
  code = code.replace(/(es: \{\n)/, `$1${keysStrES}\n`);

  // Insert EN keys
  const keysStrEN = Object.entries(newKeysEN).map(([k, v]) => `    "${k}": "${v}",`).join('\n');
  code = code.replace(/(en: \{\n)/, `$1${keysStrEN}\n`);

  const envKeysObj = Object.entries(newKeysEN).map(([k, v]) => `    "${k}": "${v}",`).join('\n');
  code = code.replace(/(pt: \{\n)/, `$1${envKeysObj}\n`);
  code = code.replace(/(fr: \{\n)/, `$1${envKeysObj}\n`);
  code = code.replace(/(de: \{\n)/, `$1${envKeysObj}\n`);
  code = code.replace(/(it: \{\n)/, `$1${envKeysObj}\n`);

  fs.writeFileSync(path, code);
};

const replaceInFile = (path, replacements) => {
  let content = fs.readFileSync(path, 'utf8');
  replacements.forEach(([from, to]) => {
     content = content.replace(from, to);
  });
  fs.writeFileSync(path, content);
};

const newKeysES = {
  // SmartHubView
  "smart.hubTitle": "Centro Inteligente",
  "smart.hubDesc": "Tu espacio personalizado y utilidades",
  "smart.recommended": "Recomendado para ti",
  "smart.noData": "Sin datos disponibles",
  "smart.quickTools": "Herramientas Rápidas",
  "smart.calc": "Calculadora",
  "smart.notes": "Bloc Notas",
  "smart.qr": "Código QR",
  "smart.converter": "Conversor"
};

const newKeysEN = {
  // SmartHubView
  "smart.hubTitle": "Smart Center",
  "smart.hubDesc": "Your personalized space and utilities",
  "smart.recommended": "Recommended for you",
  "smart.noData": "No data available",
  "smart.quickTools": "Quick Tools",
  "smart.calc": "Calculator",
  "smart.notes": "Notes",
  "smart.qr": "QR Code",
  "smart.converter": "Converter"
};

updateTranslations(newKeysES, newKeysEN);

replaceInFile('src/components/views/SmartHubView.tsx', [
  ['>Centro Inteligente<', '>{t("smart.hubTitle") || "Centro Inteligente"}<'],
  ['>Tu espacio personalizado y utilidades<', '>{t("smart.hubDesc") || "Tu espacio personalizado y utilidades"}<'],
  ['>Recomendado para ti<', '>{t("smart.recommended") || "Recomendado para ti"}<'],
  ['>Sin datos disponibles<', '>{t("smart.noData") || "Sin datos disponibles"}<'],
  ['>Herramientas Rápidas<', '>{t("smart.quickTools") || "Herramientas Rápidas"}<'],
  ["name: 'Calculadora'", "name: t('smart.calc') || 'Calculadora'"],
  ["name: 'Bloc Notas'", "name: t('smart.notes') || 'Bloc Notas'"],
  ["name: 'Código QR'", "name: t('smart.qr') || 'Código QR'"],
  ["name: 'Conversor'", "name: t('smart.converter') || 'Conversor'"]
]);

console.log('Automated replacements completed 2.');
