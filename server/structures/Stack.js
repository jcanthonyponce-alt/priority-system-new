class Stack {
  constructor() {
    this.items = [];
  }

  push(item) {
    this.items.push(item);
  }

  pop() {
    return this.items.pop() || null;
  }

  peek() {
    return this.items[this.items.length - 1] || null;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  // newest first, handy for showing "recently deleted"
  toArray() {
    return [...this.items].reverse();
  }
}

module.exports = Stack;