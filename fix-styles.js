const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/[groupId]/page.tsx');

if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  let updated = content;
  
  // 1. Fix white borders
  updated = updated.replace(/border-slate-50(?!(\/| dark:))/g, 'border-slate-100 dark:border-slate-800');
  updated = updated.replace(/divide-slate-50(?!(\/| dark:))/g, 'divide-slate-100 dark:divide-slate-800');

  // 2. Fix Member Sheet Background
  // Line ~584: SheetContent side="left"
  updated = updated.replace(/className="w-\[85vw\] sm:max-w-sm p-0 flex flex-col bg-white dark:bg-slate-900"/, 'className="w-[85vw] sm:max-w-sm p-0 flex flex-col bg-white dark:bg-slate-950"');
  
  // 3. Fix Share Sheet Backgrounds
  // Line ~1348: SheetContent side="right"
  updated = updated.replace(/className="bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-xl p-0 flex flex-col"/, 'className="bg-white dark:bg-slate-950 border-l border-slate-100 dark:border-slate-800 shadow-xl p-0 flex flex-col"');
  
  // Fix Share Sheet Header
  // Line ~1352:
  updated = updated.replace(/className="flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0 bg-white dark:bg-slate-900"/, 'className="flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0 bg-white dark:bg-slate-950"');

  // Fix bg-slate-50/50 without dark mode inside the share sheet container
  updated = updated.replace(/bg-slate-50\/50/g, 'bg-slate-50/50 dark:bg-slate-950');

  // 4. Update the Share Card interior to be slate-950 or true black so it's not "gray"
  updated = updated.replace(/id="share-card"[\s\S]*?className="bg-white dark:bg-slate-900/g, 'id="share-card"\n              className="bg-white dark:bg-[#020617]');

  fs.writeFileSync(file, updated, 'utf8');
  console.log("Updated styles successfully.");
} else {
  console.log("File not found.");
}
