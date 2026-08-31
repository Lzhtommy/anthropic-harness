import store from '../db/store.js';

const COLLECTION = 'products';

// 排序白名单（PRD-R-005）：白名单外的 sort 值一律忽略（PRD-S-016，静默降级为默认顺序）。
// cmp 恒不抛错；createdAt 解析失败按 -Infinity 处理 → newest 下排末尾。
function cmp(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function createdAtTime(p) {
  const t = Date.parse(p.createdAt);
  return Number.isNaN(t) ? -Infinity : t;
}

const SORTERS = {
  price_asc: (a, b) => cmp(Number(a.price), Number(b.price)),
  price_desc: (a, b) => cmp(Number(b.price), Number(a.price)),
  newest: (a, b) => cmp(createdAtTime(b), createdAtTime(a)),
};

const Product = {
  // 契约：先 keyword 过滤、后 sort 排序（PRD-S-014）；排序用数组副本，
  // 禁止原地修改 store 返回的数组（否则污染默认顺序，违反 PRD-S-013）。
  find(filter = {}) {
    let rows = store.read(COLLECTION);
    if (filter.keyword) {
      const kw = String(filter.keyword).toLowerCase();
      rows = rows.filter((p) => p.name.toLowerCase().includes(kw));
    }
    const sorter =
      typeof filter.sort === 'string' && Object.hasOwn(SORTERS, filter.sort)
        ? SORTERS[filter.sort]
        : null;
    if (sorter) {
      rows = [...rows].sort(sorter);
    }
    return rows;
  },

  findById(id) {
    return store.read(COLLECTION).find((p) => String(p.id) === String(id)) ?? null;
  },

  create(fields) {
    const rows = store.read(COLLECTION);
    const product = {
      id: store.nextId(COLLECTION),
      createdAt: new Date().toISOString(),
      ...fields,
    };
    rows.push(product);
    store.write(COLLECTION, rows);
    return product;
  },
};

export default Product;
