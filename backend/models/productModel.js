import store from '../db/store.js';

const COLLECTION = 'products';

const Product = {
  find(filter = {}) {
    let rows = store.read(COLLECTION);
    if (filter.keyword) {
      const kw = String(filter.keyword).toLowerCase();
      rows = rows.filter((p) => p.name.toLowerCase().includes(kw));
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
