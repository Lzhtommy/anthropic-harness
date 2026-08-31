import store from '../db/store.js';

const COLLECTION = 'users';

const User = {
  findByEmail(email) {
    return (
      store.read(COLLECTION).find(
        (u) => u.email.toLowerCase() === String(email).toLowerCase()
      ) ?? null
    );
  },

  findById(id) {
    return store.read(COLLECTION).find((u) => String(u.id) === String(id)) ?? null;
  },
};

export default User;
