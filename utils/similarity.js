function jaroWinkler(s1, s2) {
  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = Array(len1).fill(false);
  const s2Matches = Array(len2).fill(false);

  let matches = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (!matches) return 0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) t++;
    k++;
  }

  t /= 2;

  const jaro = (matches / len1 + matches / len2 + (matches - t) / matches) / 3;

  let prefix = 0;
  for (let i = 0; i < Math.min(4, len1, len2); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

function tokenWiseJW(normalized1, normalized2) {
  const t1 = normalized1.split(" ");
  const t2 = normalized2.split(" ");

  let total = 0;
  for (let i = 0; i < Math.min(t1.length, t2.length); i++) {
    total += jaroWinkler(t1[i], t2[i]);
  }

  return total / Math.max(t1.length, t2.length);
}

function fuzzyTokenOverlapScore(normalizedName1, normalizedName2) {
  const tokens1 = normalizedName1.split(" ");
  const tokens2 = normalizedName2.split(" ");

  let matches = 0;

  for (const t1 of tokens1) {
    let best = 0;
    for (const t2 of tokens2) {
      const score = jaroWinkler(t1, t2);
      if (score > best) best = score;
    }
    if (best >= 0.9) matches++;
  }

  return matches / Math.max(tokens1.length, tokens2.length);
}

function computeNameSimilarity(normalizedInput, normalizedWatch) {
  const jwScore = jaroWinkler(normalizedInput, normalizedWatch);
  const tokenScore = fuzzyTokenOverlapScore(normalizedInput, normalizedWatch);
  return 0.9 * jwScore + 0.1 * tokenScore;
  // const jwScore = jaroWinkler(normalizedInput, normalizedWatch);
  // const jwTokenWiseScore = tokenWiseJW(normalizedInput, normalizedWatch);
  // return 0.5 * jwScore + 0.5 * jwTokenWiseScore;
}

module.exports = {
  computeNameSimilarity,
  jaroWinkler,
  fuzzyTokenOverlapScore,
  tokenWiseJW,
};
