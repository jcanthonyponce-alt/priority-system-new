// Hash table that handles collisions with chaining (each bucket is a list)
class HashMap {
  constructor(capacity = 16) {
    this.capacity = capacity;
    this.buckets = Array.from({ length: capacity }, () => []);
    this.count = 0;
  }

  _hash(key) {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % this.capacity;
    }
    return hash;
  }

  set(key, value) {
    const bucket = this.buckets[this._hash(key)];
    for (const entry of bucket) {
      if (entry[0] === key) {
        entry[1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.count++;
    if (this.count / this.capacity > 0.75) this._resize();
  }

  get(key) {
    const bucket = this.buckets[this._hash(key)];
    for (const entry of bucket) {
      if (entry[0] === key) return entry[1];
    }
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    const bucket = this.buckets[this._hash(key)];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.count--;
        return true;
      }
    }
    return false;
  }

  keys() {
    return this.buckets.flat().map((entry) => entry[0]);
  }

  values() {
    return this.buckets.flat().map((entry) => entry[1]);
  }

  size() {
    return this.count;
  }

  // when the table gets too full, double its size and re-place every entry
  _resize() {
    const oldEntries = this.buckets.flat();
    this.capacity *= 2;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.count = 0;
    for (const [key, value] of oldEntries) {
      this.set(key, value);
    }
  }
}

module.exports = HashMap;