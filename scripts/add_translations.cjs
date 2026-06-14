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
  console.error("Error evaluating object string:", e);
  process.exit(1);
}

const newKeys = {
  "home.loadingTrends": {
    es: "Cargando tendencias...",
    en: "Loading trends...",
    pt: "Carregando tendências...",
    fr: "Chargement des tendances...",
    de: "Trends werden geladen...",
    it: "Caricamento tendenze..."
  },
  "home.newBadge": {
    es: "Nuevo",
    en: "New",
    pt: "Novo",
    fr: "Nouveau",
    de: "Neu",
    it: "Nuovo"
  },
  "home.hot": {
    es: "Hot",
    en: "Hot",
    pt: "Hot",
    fr: "Hot",
    de: "Hot",
    it: "Hot"
  },
  "contact.officialEmail": {
    es: "Correo Oficial",
    en: "Official Email",
    pt: "E-mail Oficial",
    fr: "E-mail Officiel",
    de: "Offizielle E-Mail",
    it: "Email Ufficiale"
  },
  "contact.discordCommunity": {
    es: "Comunidad Discord",
    en: "Discord Community",
    pt: "Comunidade Discord",
    fr: "Communauté Discord",
    de: "Discord Community",
    it: "Comunità Discord"
  },
  "contact.discordDesc": {
    es: "Únete a la comunidad oficial de NexusPlay",
    en: "Join the official NexusPlay community",
    pt: "Junte-se à comunidade oficial NexusPlay",
    fr: "Rejoignez la communauté officielle NexusPlay",
    de: "Treten Sie der offiziellen NexusPlay-Community bei",
    it: "Unisciti alla comunità ufficiale di NexusPlay"
  },
  "contact.join": {
    es: "Unirse",
    en: "Join",
    pt: "Entrar",
    fr: "Rejoindre",
    de: "Beitreten",
    it: "Unisciti"
  },
  "contact.copyEmail": {
    es: "Copiar correo",
    en: "Copy email",
    pt: "Copiar e-mail",
    fr: "Copier l'e-mail",
    de: "E-Mail kopieren",
    it: "Copia email"
  },
  "contact.sendEmail": {
    es: "Enviar Correo",
    en: "Send Email",
    pt: "Enviar e-mail",
    fr: "Envoyer l'e-mail",
    de: "E-Mail senden",
    it: "Invia un'email"
  },
  "contact.emailHelp": {
    es: "Usa nuestro correo oficial y obtén ayuda personalizada.",
    en: "Use our official email to get personalized help.",
    pt: "Use nosso e-mail oficial e obtenha ajuda personalizada.",
    fr: "Utilisez notre e-mail officiel pour une aide personnalisée.",
    de: "Nutzen Sie unsere offizielle E-Mail für persönliche Hilfe.",
    it: "Usa la nostra email ufficiale per ottenere un aiuto personalizzato."
  },
  "contact.defaultSubject": {
     es: "Soporte NexusPlay",
     en: "NexusPlay Support",
     pt: "Suporte NexusPlay",
     fr: "Support NexusPlay",
     de: "NexusPlay Support",
     it: "Supporto NexusPlay"
  }
};

for (const [lang, translations] of Object.entries(parsedObj)) {
  for (const [key, values] of Object.entries(newKeys)) {
    if (values[lang]) {
      translations[key] = values[lang];
    } else {
      translations[key] = values['es']; // callback
    }
  }
}

const newContent = `export const translations: Record<string, Record<string, string>> = ${JSON.stringify(parsedObj, null, 2)};\n\nexport type LanguageCode = keyof typeof translations;\nexport type TranslationKey = keyof typeof translations.es;\n`;

fs.writeFileSync(path, newContent, 'utf8');
console.log("Successfully added new keys!");
