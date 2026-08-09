import fs from 'fs';

const matchdayFile = 'd:/02_PROJECTS/13_KATFC/src/pages/Matchday.tsx';
let matchdayContent = fs.readFileSync(matchdayFile, 'utf8');

matchdayContent = matchdayContent.replace(/THẮNG 5TactiQ/g, 'THẮNG ${settings.teamName || \'5TactiQ\'}');
matchdayContent = matchdayContent.replace(/leftLabel: '5TactiQ'/g, 'leftLabel: settings.teamName || \'5TactiQ\'');
matchdayContent = matchdayContent.replace(/'Đá Nội Bộ 5TactiQ'/g, '`Đá Nội Bộ ${settings.teamName || \'5TactiQ\'}`');
matchdayContent = matchdayContent.replace(/'ĐÁ NỘI BỘ 5TactiQ'/g, '`ĐÁ NỘI BỘ ${(settings.teamName || \'5TactiQ\').toUpperCase()}`');
matchdayContent = matchdayContent.replace(/'5TactiQ NỘI BỘ'/g, '`${(settings.teamName || \'5TactiQ\').toUpperCase()} NỘI BỘ`');
matchdayContent = matchdayContent.replace(/>5TactiQ</g, '>{(settings.teamName || \'5TactiQ\').toUpperCase()}<');

fs.writeFileSync(matchdayFile, matchdayContent);
console.log('Done replacing in Matchday.tsx');

const h2hFile = 'd:/02_PROJECTS/13_KATFC/src/pages/HeadToHead.tsx';
let h2hContent = fs.readFileSync(h2hFile, 'utf8');

// Also need to make sure HeadToHead uses settings
// Let's check if it imports useSettingsStore
if (!h2hContent.includes('useSettingsStore')) {
  h2hContent = h2hContent.replace(/import \{ useMatchStore \} from '\.\.\/store\/useMatchStore';/, "import { useMatchStore } from '../store/useMatchStore';\nimport { useSettingsStore } from '../store/useSettingsStore';");
  h2hContent = h2hContent.replace(/const \{ matches \} = useMatchStore\(\);/, "const { matches } = useMatchStore();\n  const { settings } = useSettingsStore();");
}

h2hContent = h2hContent.replace(/>5TactiQ</g, '>{(settings.teamName || \'5TactiQ\').toUpperCase()}<');

fs.writeFileSync(h2hFile, h2hContent);
console.log('Done replacing in HeadToHead.tsx');
