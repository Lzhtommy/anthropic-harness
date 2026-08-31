// 种子导入：清空并重建 db.json（破坏性，非幂等追加）。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import store from './db/store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const readSeed = (name) =>
  JSON.parse(fs.readFileSync(path.join(here, 'data', 'seed', name), 'utf8'));

store.reset({
  products: readSeed('products.json'),
  users: readSeed('users.json'),
});

console.log('Data imported: products + users');
