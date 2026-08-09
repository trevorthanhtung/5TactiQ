const fs = require('fs');
const path = require('path');

const storeDir = path.join(__dirname, '../src/store');
const files = fs.readdirSync(storeDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(storeDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('persist(') && !content.includes('capacitorStorage')) {
    // 1. Update imports
    content = content.replace(
      /import\s+{\s*persist\s*}\s+from\s+'zustand\/middleware';/,
      `import { persist, createJSONStorage } from 'zustand/middleware';\nimport { capacitorStorage } from '../utils/capacitorStorage';`
    );

    // 2. Add storage to persist config
    content = content.replace(
      /name:\s*('[\w-]+')\s*,?/g,
      match => {
        // If it already has storage, ignore
        if (content.includes('storage:')) return match;
        return `${match}\n      storage: createJSONStorage(() => capacitorStorage),`;
      }
    );

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
