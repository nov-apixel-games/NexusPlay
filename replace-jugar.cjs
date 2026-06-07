const fs = require('fs');

const file = 'src/components/views/GamesHubView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/'games.play'\)} Ahora/g, "'games.play')}").replace(/> Jugar<|>\s*Jugar\s*</g, ">{t('games.play')}<").replace(/> Jugar Ahora<|>\s*Jugar Ahora\s*</g, ">{t('games.play')}<").replace(/> Jugar sin Red<|>\s*Jugar sin Red\s*</g, ">{t('games.play_offline')}<");

fs.writeFileSync(file, content);
