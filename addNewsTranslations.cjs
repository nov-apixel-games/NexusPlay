const fs = require('fs');
let content = fs.readFileSync('src/i18n/translations.ts', 'utf8');

content = content.replace(/es: {/, "es: {\n    \"home.news\": \"Novedades\",\n    \"home.news.empty\": \"No hay novedades recientes.\",\n    \"home.news.update\": \"Actualización\",\n    \"home.news.new\": \"Nuevo\",\n    \"home.seeAll\": \"Ver Todo\",");
content = content.replace(/en: {/, "en: {\n    \"home.news\": \"What's New\",\n    \"home.news.empty\": \"No recent news.\",\n    \"home.news.update\": \"Update\",\n    \"home.news.new\": \"New\",\n    \"home.seeAll\": \"See All\",");
content = content.replace(/pt: {/, "pt: {\n    \"home.news\": \"Novidades\",\n    \"home.news.empty\": \"Não há novidades recentes.\",\n    \"home.news.update\": \"Atualização\",\n    \"home.news.new\": \"Novo\",\n    \"home.seeAll\": \"Ver Tudo\",");
content = content.replace(/fr: {/, "fr: {\n    \"home.news\": \"Nouveautés\",\n    \"home.news.empty\": \"Aucune nouveauté récente.\",\n    \"home.news.update\": \"Mise à jour\",\n    \"home.news.new\": \"Nouveau\",\n    \"home.seeAll\": \"Voir Tout\",");
content = content.replace(/de: {/, "de: {\n    \"home.news\": \"Neuigkeiten\",\n    \"home.news.empty\": \"Keine aktuellen Neuigkeiten.\",\n    \"home.news.update\": \"Aktualisieren\",\n    \"home.news.new\": \"Neu\",\n    \"home.seeAll\": \"Alles Sehen\",");
content = content.replace(/it: {/, "it: {\n    \"home.news\": \"Novità\",\n    \"home.news.empty\": \"Nessuna novità recente.\",\n    \"home.news.update\": \"Aggiornamento\",\n    \"home.news.new\": \"Nuovo\",\n    \"home.seeAll\": \"Vedi Tutto\",");

fs.writeFileSync('src/i18n/translations.ts', content, 'utf8');
