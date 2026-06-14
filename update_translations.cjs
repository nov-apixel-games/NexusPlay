const fs = require('fs');

const path = 'src/i18n/translations.ts';
let code = fs.readFileSync(path, 'utf8');

const newKeys = {
  es: {
    "theme.amoled": "AMOLED",
    "theme.auto": "Automático",
    "settings.privacy": "Privacidad",
    "settings.advanced": "Avanzado",
    "settings.themeSelector": "Selector de Tema",
    "games.createHtml5": "Crear Juego HTML5",
    "games.games": "Juegos",
    "games.community": "Comunidad",
    "games.locals": "Locales",
    "games.offlineSupport": "Soporte Offline Integrado",
    "games.communityFeatured": "Destacados de la Comunidad",
    "explore.education": "Educación",
    "explore.entertainment": "Entretenimiento",
    "explore.featured": "Destacados"
  },
  en: {
    "theme.amoled": "AMOLED",
    "theme.auto": "Auto",
    "settings.privacy": "Privacy",
    "settings.advanced": "Advanced",
    "settings.themeSelector": "Theme Selector",
    "games.createHtml5": "Create HTML5 Game",
    "games.games": "Games",
    "games.community": "Community",
    "games.locals": "Locals",
    "games.offlineSupport": "Integrated Offline Support",
    "games.communityFeatured": "Community Featured",
    "explore.education": "Education",
    "explore.entertainment": "Entertainment",
    "explore.featured": "Featured"
  },
  pt: {
    "theme.amoled": "AMOLED",
    "theme.auto": "Automático",
    "settings.privacy": "Privacidade",
    "settings.advanced": "Avançado",
    "settings.themeSelector": "Seletor de Tema",
    "games.createHtml5": "Criar Jogo HTML5",
    "games.games": "Jogos",
    "games.community": "Comunidade",
    "games.locals": "Locais",
    "games.offlineSupport": "Suporte Offline Integrado",
    "games.communityFeatured": "Destaques da Comunidade",
    "explore.education": "Educação",
    "explore.entertainment": "Entretenimento",
    "explore.featured": "Destaques"
  },
  fr: {
    "theme.amoled": "AMOLED",
    "theme.auto": "Auto",
    "settings.privacy": "Confidentialité",
    "settings.advanced": "Avancé",
    "settings.themeSelector": "Sélecteur de Thème",
    "games.createHtml5": "Créer un jeu HTML5",
    "games.games": "Jeux",
    "games.community": "Communauté",
    "games.locals": "Locaux",
    "games.offlineSupport": "Support hors-ligne intégré",
    "games.communityFeatured": "En vedette (Communauté)",
    "explore.education": "Éducation",
    "explore.entertainment": "Divertissement",
    "explore.featured": "En vedette"
  },
  de: {
    "theme.amoled": "AMOLED",
    "theme.auto": "Auto",
    "settings.privacy": "Datenschutz",
    "settings.advanced": "Erweitert",
    "settings.themeSelector": "Themenauswahl",
    "games.createHtml5": "HTML5-Spiel erstellen",
    "games.games": "Spiele",
    "games.community": "Gemeinschaft",
    "games.locals": "Lokal",
    "games.offlineSupport": "Integrierter Offline-Support",
    "games.communityFeatured": "Community-Highlights",
    "explore.education": "Bildung",
    "explore.entertainment": "Unterhaltung",
    "explore.featured": "Hervorgehoben"
  },
  it: {
    "theme.amoled": "AMOLED",
    "theme.auto": "Auto",
    "settings.privacy": "Privacy",
    "settings.advanced": "Avanzate",
    "settings.themeSelector": "Selettore Tema",
    "games.createHtml5": "Crea gioco HTML5",
    "games.games": "Giochi",
    "games.community": "Comunità",
    "games.locals": "Locali",
    "games.offlineSupport": "Supporto offline integrato",
    "games.communityFeatured": "In primo piano dalla comunità",
    "explore.education": "Educazione",
    "explore.entertainment": "Intrattenimento",
    "explore.featured": "In primo piano"
  }
};

for (const lang of Object.keys(newKeys)) {
  const keysStr = Object.entries(newKeys[lang])
    .map(([k, v]) => `    "${k}": "${v}",`)
    .join('\n');
  
  // Find where the `lang: {` block begins and insert after it
  const langRegex = new RegExp(`(${lang}: \\{\\n)`);
  code = code.replace(langRegex, `$1${keysStr}\n`);
}

fs.writeFileSync(path, code);
