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
  
  // Just use EN keys for pt, fr, de, it as placeholders
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
  // SettingsView
  "settings.alerts": "Alertas de Ofertas",
  "settings.user": "Usuario",
  "settings.email": "Correo Electrónico",
  "settings.newPassword": "Nueva Contraseña",
  "settings.deleteAccount": "Eliminar Cuenta",
  "settings.networkPrefs": "Preferencias de Red de Descarga",
  "settings.autoUpdates": "Actualizaciones Automáticas",
  "settings.clearHistory": "Eliminar Historial",
  "settings.exportChat": "Exportar Conversación",
  "settings.connection": "Conexión",
  "settings.installation": "Instalación",
  "settings.appInstalled": "App Instalada",
  "settings.installApp": "Instalar App",
  "settings.localResources": "Recursos Locales",
  "settings.approxUse": "Uso Aproximado",
  "settings.checkUpdates": "Buscar Actualizaciones de Cliente",
  "settings.support": "Soporte",

  // GamesHubView
  "games.about": "Acerca del juego",
  "games.noGamesPublished": "Todavía no hay juegos publicados",
  "games.addToProjects": "Añadir a Proyectos",
  "games.topCreators": "Mejores Creadores",
  "games.follow": "Seguir",
  "games.noDrafts": "No tienes borradores todavía",

  // MainViews
  "main.noPosts": "No hay publicaciones todavía",
  "main.aiTitle": "Inteligencia",
  "main.consultAI": "Consultar IA",
  "main.noPacks": "No hay packs todavía",
  "main.yourAccount": "Tu Cuenta Nexus",
  "main.verified": "Verificado",
  "main.player": "Jugador",
  "main.dropImage": "Suelta tu imagen o Haz Clic para subir",
  "main.generatingAI": "Generando por IA",
  "main.displayName": "Nombre Visible",
  "main.shortBio": "Biografía corta o Estado",
  "main.currentXP": "XP Actual",
  "main.communityMissions": "Misiones de Comunidad",
  "main.openSettings": "Abrir Ajustes",
  "main.installAgain": "Instalar de nuevo",
  "main.noRecentDownloads": "No tienes descargas recientes",
  "main.liveEvent": "EVENTO EN VIVO",
  "main.exploreEvent": "Explorar Evento",
  "main.noResults": "No encontramos resultados",
  "main.tryAnother": "Intenta otro nombre o revisa la ortografía"
};

const newKeysEN = {
  // SettingsView
  "settings.alerts": "Deal Alerts",
  "settings.user": "User",
  "settings.email": "Email",
  "settings.newPassword": "New Password",
  "settings.deleteAccount": "Delete Account",
  "settings.networkPrefs": "Download Network Preferences",
  "settings.autoUpdates": "Auto Updates",
  "settings.clearHistory": "Clear History",
  "settings.exportChat": "Export Conversation",
  "settings.connection": "Connection",
  "settings.installation": "Installation",
  "settings.appInstalled": "App Installed",
  "settings.installApp": "Install App",
  "settings.localResources": "Local Resources",
  "settings.approxUse": "Approximate Use",
  "settings.checkUpdates": "Check for Client Updates",
  "settings.support": "Support",

  // GamesHubView
  "games.about": "About the game",
  "games.noGamesPublished": "No games published yet",
  "games.addToProjects": "Add to Projects",
  "games.topCreators": "Top Creators",
  "games.follow": "Follow",
  "games.noDrafts": "You don't have any drafts yet",

  // MainViews
  "main.noPosts": "No posts yet",
  "main.aiTitle": "Intelligence",
  "main.consultAI": "Ask AI",
  "main.noPacks": "No packs yet",
  "main.yourAccount": "Your Nexus Account",
  "main.verified": "Verified",
  "main.player": "Player",
  "main.dropImage": "Drop your image or Click to upload",
  "main.generatingAI": "Generating by AI",
  "main.displayName": "Display Name",
  "main.shortBio": "Short Bio or Status",
  "main.currentXP": "Current XP",
  "main.communityMissions": "Community Missions",
  "main.openSettings": "Open Settings",
  "main.installAgain": "Install Again",
  "main.noRecentDownloads": "You have no recent downloads",
  "main.liveEvent": "LIVE EVENT",
  "main.exploreEvent": "Explore Event",
  "main.noResults": "We found no results",
  "main.tryAnother": "Try another name or check spelling"
};

updateTranslations(newKeysES, newKeysEN);

replaceInFile('src/components/views/SettingsView.tsx', [
  ['>Alertas de Ofertas<', '>{t("settings.alerts") || "Alertas de Ofertas"}<'],
  ['>Usuario<', '>{t("settings.user") || "Usuario"}<'],
  ['>Correo Electrónico<', '>{t("settings.email") || "Correo Electrónico"}<'],
  ['>Nueva Contraseña<', '>{t("settings.newPassword") || "Nueva Contraseña"}<'],
  ['>Eliminar Cuenta<', '>{t("settings.deleteAccount") || "Eliminar Cuenta"}<'],
  ['>Preferencias de Red de Descarga<', '>{t("settings.networkPrefs") || "Preferencias de Red de Descarga"}<'],
  ['>Actualizaciones Automáticas<', '>{t("settings.autoUpdates") || "Actualizaciones Automáticas"}<'],
  ['>Eliminar Historial<', '>{t("settings.clearHistory") || "Eliminar Historial"}<'],
  ['>Exportar Conversación<', '>{t("settings.exportChat") || "Exportar Conversación"}<'],
  ['>Conexión<', '>{t("settings.connection") || "Conexión"}<'],
  ['>Instalación<', '>{t("settings.installation") || "Instalación"}<'],
  ['>App Instalada<', '>{t("settings.appInstalled") || "App Instalada"}<'],
  ['>Instalar App<', '>{t("settings.installApp") || "Instalar App"}<'],
  ['>Recursos Locales<', '>{t("settings.localResources") || "Recursos Locales"}<'],
  ['>Uso Aproximado<', '>{t("settings.approxUse") || "Uso Aproximado"}<'],
  ['>Buscar Actualizaciones de Cliente<', '>{t("settings.checkUpdates") || "Buscar Actualizaciones de Cliente"}<'],
  ['>Soporte<', '>{t("settings.support") || "Soporte"}<'],
]);

replaceInFile('src/components/views/GamesHubView.tsx', [
  ['>Acerca del juego<', '>{t("games.about") || "Acerca del juego"}<'],
  ['>Todavía no hay juegos publicados<', '>{t("games.noGamesPublished") || "Todavía no hay juegos publicados"}<'],
  ['>Añadir a Proyectos<', '>{t("games.addToProjects") || "Añadir a Proyectos"}<'],
  ['>Mejores Creadores<', '>{t("games.topCreators") || "Mejores Creadores"}<'],
  ['>Seguir<', '>{t("games.follow") || "Seguir"}<'],
  ['>No tienes borradores todavía<', '>{t("games.noDrafts") || "No tienes borradores todavía"}<'],
]);

replaceInFile('src/components/views/MainViews.tsx', [
  ['>No hay publicaciones todavía<', '>{t("main.noPosts") || "No hay publicaciones todavía"}<'],
  ['>Inteligencia<', '>{t("main.aiTitle") || "Inteligencia"}<'],
  ['>Consultar IA<', '>{t("main.consultAI") || "Consultar IA"}<'],
  ['>No hay packs todavía<', '>{t("main.noPacks") || "No hay packs todavía"}<'],
  ['>Tu Cuenta Nexus<', '>{t("main.yourAccount") || "Tu Cuenta Nexus"}<'],
  ['>Verificado<', '>{t("main.verified") || "Verificado"}<'],
  ['>Jugador<', '>{t("main.player") || "Jugador"}<'],
  ['>Suelta tu imagen o Haz Clic para subir<', '>{t("main.dropImage") || "Suelta tu imagen o Haz Clic para subir"}<'],
  ['>Generando por IA<', '>{t("main.generatingAI") || "Generando por IA"}<'],
  ['>Nombre Visible<', '>{t("main.displayName") || "Nombre Visible"}<'],
  ['>Biografía corta o Estado<', '>{t("main.shortBio") || "Biografía corta o Estado"}<'],
  ['>XP Actual<', '>{t("main.currentXP") || "XP Actual"}<'],
  ['>Misiones de Comunidad<', '>{t("main.communityMissions") || "Misiones de Comunidad"}<'],
  ['>Abrir Ajustes<', '>{t("main.openSettings") || "Abrir Ajustes"}<'],
  ['>Instalar de nuevo<', '>{t("main.installAgain") || "Instalar de nuevo"}<'],
  ['>No tienes descargas recientes<', '>{t("main.noRecentDownloads") || "No tienes descargas recientes"}<'],
  ['>EVENTO EN VIVO<', '>{t("main.liveEvent") || "EVENTO EN VIVO"}<'],
  ['>Explorar Evento<', '>{t("main.exploreEvent") || "Explorar Evento"}<'],
  ['>No encontramos resultados<', '>{t("main.noResults") || "No encontramos resultados"}<'],
  ['>Intenta otro nombre o revisa la ortografía<', '>{t("main.tryAnother") || "Intenta otro nombre o revisa la ortografía"}<'],
]);

console.log('Automated replacements completed.');
