// JSON 文件存储层：给 Model 层提供最小的持久化原语。
// 设计目标：零外部服务依赖（替代课程示例中的 MongoDB），接口风格贴近 Model 习惯。
import fs from 'fs';
import path from 'path';
import config from '../config.js';

function load() {
  if (!fs.existsSync(config.dbFile)) {
    return { products: [], users: [] };
  }
  return JSON.parse(fs.readFileSync(config.dbFile, 'utf8'));
}

function save(db) {
  fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
  fs.writeFileSync(config.dbFile, JSON.stringify(db, null, 2));
}

const store = {
  read(collection) {
    return load()[collection] ?? [];
  },
  write(collection, rows) {
    const db = load();
    db[collection] = rows;
    save(db);
  },
  reset(data) {
    save(data);
  },
  nextId(collection) {
    const rows = load()[collection] ?? [];
    return rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
  },
};

export default store;
