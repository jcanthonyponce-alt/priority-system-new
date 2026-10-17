// Linear search: check every task one by one for the search text
function linearSearch(items, text) {
  const q = String(text || "").trim().toLowerCase();
  if (!q) return items;
  const found = [];
  for (const item of items) {
    const title = item.title.toLowerCase();
    const description = (item.description || "").toLowerCase();
    if (title.includes(q) || description.includes(q)) found.push(item);
  }
  return found;
}

module.exports = { linearSearch };