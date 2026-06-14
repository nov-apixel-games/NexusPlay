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
  "contact.form.name": { es: "Nombre", en: "Name", pt: "Nome", fr: "Nom", de: "Name", it: "Nome" },
  "contact.form.namePlaceholder": { es: "Tu nombre", en: "Your name", pt: "Seu nome", fr: "Votre nom", de: "Dein Name", it: "Il tuo nome" },
  "contact.form.email": { es: "Correo Electrónico", en: "Email", pt: "E-mail", fr: "E-mail", de: "E-Mail", it: "Email" },
  "contact.form.emailPlaceholder": { es: "tu@correo.com", en: "you@email.com", pt: "voce@email.com", fr: "vous@email.com", de: "du@email.com", it: "tu@email.com" },
  "contact.form.subject": { es: "Asunto", en: "Subject", pt: "Assunto", fr: "Sujet", de: "Betreff", it: "Soggetto" },
  "contact.form.subjectPlaceholder": { es: "Asunto del mensaje", en: "Message subject", pt: "Assunto da mensagem", fr: "Sujet du message", de: "Betreff der Nachricht", it: "Oggetto del messaggio" },
  "contact.form.category": { es: "Categoría", en: "Category", pt: "Categoria", fr: "Catégorie", de: "Kategorie", it: "Categoria" },
  "contact.form.message": { es: "Mensaje", en: "Message", pt: "Mensagem", fr: "Message", de: "Nachricht", it: "Messaggio" },
  "contact.form.messagePlaceholder": { es: "Describe tu consulta detalladamente...", en: "Describe your query in detail...", pt: "Descreva sua consulta detalhadamente...", fr: "Décrivez votre demande en détail...", de: "Beschreiben Sie Ihre Anfrage im Detail...", it: "Descrivi la tua richiesta in modo dettagliato..." },
  "contact.form.sending": { es: "Enviando...", en: "Sending...", pt: "Enviando...", fr: "Envoi en cours...", de: "Senden...", it: "Invio..." },
  "contact.form.send": { es: "Enviar Mensaje", en: "Send Message", pt: "Enviar Mensagem", fr: "Envoyer le message", de: "Nachricht senden", it: "Invia Messaggio" },
  "contact.success.title": { es: "Mensaje enviado", en: "Message sent", pt: "Mensagem enviada", fr: "Message envoyé", de: "Nachricht gesendet", it: "Messaggio inviato" },
  "contact.success.desc": { es: "Nos pondremos en contacto contigo pronto.", en: "We will get in touch with you soon.", pt: "Entraremos em contato em breve.", fr: "Nous vous contacterons bientôt.", de: "Wir werden uns bald bei Ihnen melden.", it: "Ti contatteremo presto." },
  "contact.form.error": { es: "Error enviando mensaje: ", en: "Error sending message: ", pt: "Erro ao enviar mensagem: ", fr: "Erreur lors de l'envoi du message : ", de: "Fehler beim Senden der Nachricht: ", it: "Errore durante l'invio del messaggio: " },
  "contact.back": { es: "Volver", en: "Back", pt: "Voltar", fr: "Retour", de: "Zurück", it: "Indietro" },
  "contact.cat.support": { es: "Soporte Técnico", en: "Technical Support", pt: "Suporte Técnico", fr: "Support Technique", de: "Technischer Support", it: "Supporto Tecnico" },
  "contact.cat.account": { es: "Problemas de cuenta", en: "Account issues", pt: "Problemas de conta", fr: "Problèmes de compte", de: "Kontoprobleme", it: "Problemi di account" },
  "contact.cat.devs": { es: "Desarrolladores", en: "Developers", pt: "Desenvolvedores", fr: "Développeurs", de: "Entwickler", it: "Sviluppatori" },
  "contact.cat.report": { es: "Reportar aplicación", en: "Report app", pt: "Relatar aplicativo", fr: "Signaler l'application", de: "App melden", it: "Segnala app" },
  "contact.cat.ideas": { es: "Sugerencias", en: "Suggestions", pt: "Sugestões", fr: "Suggestions", de: "Vorschläge", it: "Suggerimenti" },
  "contact.cat.other": { es: "Otro", en: "Other", pt: "Outro", fr: "Autre", de: "Andere", it: "Altro" }
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
