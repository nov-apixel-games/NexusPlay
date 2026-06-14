const fs = require('fs');
let c = fs.readFileSync('src/components/Footer.tsx', 'utf8');

c = c.replace(/ \|\| '.*?'/g, '');
c = c.replace(/ \|\| ".*?"/g, '');

fs.writeFileSync('src/components/Footer.tsx', c);
