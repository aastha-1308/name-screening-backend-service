function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ") // collapse multiple spaces into ONE
    .trim(); // remove leading/trailing spaces
}

function tokenizeAndSort(name) {
  return normalizeName(name).split(" ").sort().join(" ");
}

module.exports = { normalizeName, tokenizeAndSort };
