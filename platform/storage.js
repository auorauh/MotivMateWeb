const storage = {
  async setItem(key, value) {
    localStorage.setItem(key, value);
  },
  async getItem(key) {
    return localStorage.getItem(key);
  },
  async removeItem(key) {
    localStorage.removeItem(key);
  },
};

export default storage;
