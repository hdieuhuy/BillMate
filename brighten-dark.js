const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'src/app/layout.tsx'),
  path.join(__dirname, 'src/app/page.tsx'),
  path.join(__dirname, 'src/app/[groupId]/page.tsx'),
  path.join(__dirname, 'src/components/theme-toggle.tsx')
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let updated = content;
    
    // First, temporarily map slate-800, slate-700, slate-600 borders so we don't double replace
    updated = updated.replace(/dark:border-slate-600/g, 'TEMP_BORDER_500');
    updated = updated.replace(/dark:border-slate-700/g, 'TEMP_BORDER_600');
    updated = updated.replace(/dark:border-slate-800/g, 'TEMP_BORDER_700');
    
    // Backgrounds
    updated = updated.replace(/dark:bg-slate-800/g, 'TEMP_BG_700');
    updated = updated.replace(/dark:bg-slate-900/g, 'TEMP_BG_800');
    updated = updated.replace(/dark:bg-slate-950/g, 'TEMP_BG_900');
    updated = updated.replace(/dark:bg-\[#020617\]/g, 'TEMP_BG_800');

    // Restore temp placeholders
    updated = updated.replace(/TEMP_BORDER_500/g, 'dark:border-slate-500');
    updated = updated.replace(/TEMP_BORDER_600/g, 'dark:border-slate-600');
    updated = updated.replace(/TEMP_BORDER_700/g, 'dark:border-slate-700');
    
    updated = updated.replace(/TEMP_BG_700/g, 'dark:bg-slate-700');
    updated = updated.replace(/TEMP_BG_800/g, 'dark:bg-slate-800');
    updated = updated.replace(/TEMP_BG_900/g, 'dark:bg-slate-900');

    if (updated !== content) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
