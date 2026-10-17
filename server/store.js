const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "data.json");

function load() {
  if (!fs.existsSync(FILE)) {
    const empty = { users: [], tasks: [], archive: [] };
    fs.writeFileSync(FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

// one shared copy of the data for the whole server
const db = load();

function save() {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

module.exports = { db, save };