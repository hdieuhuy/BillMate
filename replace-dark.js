const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'src/app/[groupId]/page.tsx'),
  path.join(__dirname, 'src/app/page.tsx')
];

const replacements = [
  { regex: /bg-white(?!(\/| dark:))/g, replacement: 'bg-white dark:bg-slate-900' },
  { regex: /bg-slate-50(?!(\/| dark:))/g, replacement: 'bg-slate-50 dark:bg-slate-950' },
  { regex: /text-slate-900(?! dark:)/g, replacement: 'text-slate-900 dark:text-slate-50' },
  { regex: /text-slate-800(?! dark:)/g, replacement: 'text-slate-800 dark:text-slate-200' },
  { regex: /text-slate-700(?! dark:)/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /text-slate-600(?! dark:)/g, replacement: 'text-slate-600 dark:text-slate-400' },
  { regex: /text-slate-500(?! dark:)/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /text-slate-400(?! dark:)/g, replacement: 'text-slate-400 dark:text-slate-500' },
  { regex: /border-slate-100(?! dark:)/g, replacement: 'border-slate-100 dark:border-slate-800' },
  { regex: /border-slate-200(?! dark:)/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { regex: /bg-slate-100(?!(\/| dark:))/g, replacement: 'bg-slate-100 dark:bg-slate-800' },
  { regex: /border-slate-300(?! dark:)/g, replacement: 'border-slate-300 dark:border-slate-600' }
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let updated = content;
    
    replacements.forEach(({ regex, replacement }) => {
      updated = updated.replace(regex, replacement);
    });

    if (updated !== content) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`No changes needed for ${file}`);
    }
  }
});
