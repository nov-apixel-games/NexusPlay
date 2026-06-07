const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(/bg-\[#[0-9a-fA-F]{6,8}\]cc/g, 'bg-nexus-bg/80');

  content = content.replace(/bg-\[#[0-9a-fA-F]{6,8}\]/g, (match) => {
      const hex = match.substring(5, 12).toLowerCase();
      if (['#000000', '#010101', '#020202', '#030303', '#050505', '#030407', '#030408', '#030712', '#050816', '#020617', '#080a14'].includes(hex)) {
        return 'bg-nexus-bg';
      }
      return 'bg-nexus-card';
  });

  content = content.replace(/bg-\[#[0-9a-fA-F]{6,8}\]\/[0-9]+/g, 'bg-nexus-card/80');
  content = content.replace(/border-\[#[0-9a-fA-F]{6,8}\]/g, 'border-nexus-border');
  content = content.replace(/ring-offset-\[#[0-9a-fA-F]{6,8}\]/g, 'ring-offset-nexus-bg');
  
  // Replace bg-black/... with bg-nexus-surface
  content = content.replace(/bg-black\/80 backdrop-blur/g, 'bg-nexus-overlay backdrop-blur');
  content = content.replace(/bg-black\/([0-9]+)/g, 'bg-nexus-surface');
  
  // Clean up white text usage to use nexus-text
  content = content.replace(/text-white/g, 'text-nexus-text');
  content = content.replace(/text-gray-[345]00/g, 'text-nexus-text-sec');
  content = content.replace(/text-slate-[345]00/g, 'text-nexus-text-sec');
  content = content.replace(/text-zinc-[345]00/g, 'text-nexus-text-sec');
  
  // Clean up fixed shadows with theme-aware shadows
  content = content.replace(/shadow-\[.*?rgba\(34,211,238,.*?\).*?\]/g, 'shadow-nexus-glow');
  content = content.replace(/shadow-\[.*?rgba\(6,182,212.*?\).*?\]/g, 'shadow-nexus-glow');
  content = content.replace(/shadow-\[.*?rgba\(0,0,0,.*?\).*?\]/g, 'shadow-lg');
  content = content.replace(/shadow-\[.*?rgba\(255,255,255,.*?\).*?\]/g, 'shadow-lg');
  
  content = content.replace(/bg-white\/\[0\.?[0-9]*\]/g, 'bg-nexus-card/50');
  content = content.replace(/bg-white\/([0-9]+)/g, 'bg-nexus-card/50');

  content = content.replace(/from-\[#[0-9a-fA-F]{6,8}\]cc/g, 'from-nexus-bg');
  content = content.replace(/to-\[#[0-9a-fA-F]{6,8}\]cc/g, 'to-nexus-bg');
  
  content = content.replace(/(?:from|to)-\[#[0-9a-fA-F]{6,8}\](\/[0-9]+)?/g, (match) => {
    const hex = match.match(/#([0-9a-fA-F]{6,8})/);
    if (!hex) return match;
    const isBrand = ['#5865F2', '#404EED', '#1a75ff', '#0055ff'].includes(hex[1].toUpperCase()) || ['#5865f2', '#404eed', '#1a75ff', '#0055ff'].includes(hex[1].toLowerCase());
    if (isBrand) return match;
    
    if (match.includes('from-')) return match.includes('/') ? 'from-nexus-bg/' + match.split('/')[1] : 'from-nexus-bg';
    if (match.includes('to-')) return match.includes('/') ? 'to-nexus-bg/' + match.split('/')[1] : 'to-nexus-bg';
    return match;
  });

  // Specific component background fixes
  content = content.replace(/<input([\s\S]*?)bg-nexus-card([\s\S]*?)>/g, '<input$1bg-nexus-surface$2>');
  content = content.replace(/<textarea([\s\S]*?)bg-nexus-card([\s\S]*?)>/g, '<textarea$1bg-nexus-surface$2>');
  content = content.replace(/<select([\s\S]*?)bg-nexus-card([\s\S]*?)>/g, '<select$1bg-nexus-surface$2>');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
