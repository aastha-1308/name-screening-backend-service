const express = require("express");
const fs = require("fs");
const path = require("path");

const { tokenizeAndSort } = require("./utils/normalise");
const { computeNameSimilarity, jaroWinkler } = require("./utils/similarity");
const { log } = require("./utils/logger");

const app = express();
app.use(express.json());

function getMatchType(score) {
  if (score >= 0.9) return "EXACT_MATCH";
  if (score >= 0.75) return "POSSIBLE_MATCH";
  return "NO_MATCH";
}

app.post("/process/:userId/:requestId", (req, res) => {
  const { userId, requestId } = req.params;
  log("Processing started", { requestId });
  const outputDir = path.join("output", userId, requestId);
  try {
    const inputFile = path.join(
      "data",
      userId,
      requestId,
      "input",
      "input.json",
    );
    const watchlistFile = "watchlist.json";
    // const outputDir = path.join("output", userId, requestId);

    // checking if the files exists or not.
    if (!fs.existsSync(inputFile)) {
      log("Input file missing", { requestId });
      return res.status(400).json({ error: "Input file missing" });
    }
    if (!fs.existsSync(watchlistFile)) {
      log("Watchlist file missing", { requestId });
      return res.status(400).json({ error: "Watchlist file missing" });
    }

    // skip processing, if the files have already been processed and saved to the output directory.
    if (fs.existsSync(path.join(outputDir, "detailed.json"))) {
      log("Output already exists, skipping processing", {
        userId,
        requestId,
      });
      return res.json({ outputPath: outputDir });
    }

    // if no errors, then read the files and parse them as JSON.
    const input = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
    const watchlist = JSON.parse(fs.readFileSync(watchlistFile, "utf-8"));

    if (!input.fullName) {
      log("fullName field missing in input", { requestId });
      return res.status(400).json({
        error:
          "fullName field is required. Please provide correctly formatted input.",
      });
    }

    const inputNames = Array.isArray(input.fullName)
      ? input.fullName
      : [input.fullName];

    

    const comparisons = [];

    for (const name of inputNames) {
      const normalizedInput = tokenizeAndSort(name);

      for (const entry of watchlist) {
        const normalizedWatch = tokenizeAndSort(entry.name);
        const score = computeNameSimilarity(normalizedInput, normalizedWatch);
        //const score = jaroWinkler(normalizedInput, normalizedWatch);

        comparisons.push({
          inputName: name,
          watchlistId: entry.id,
          watchlistName: entry.name,
          score: Number(score.toFixed(4)),
          matchType: getMatchType(score),
        });
      }
    }

    if (comparisons.length === 0) {
      log("No comparisons generated", { requestId });
      return res.status(400).json({ error: "No valid names to compare" });
    }

    comparisons.sort((a, b) => b.score - a.score);

    const top3 = comparisons.slice(0, 3);
    const bestMatch = top3[0];
    const finalMatchType = getMatchType(bestMatch.score);

    // Saving the output.
    fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(
      path.join(outputDir, "detailed.json"),
      JSON.stringify(
        {
          requestId,
          userId,
          rawInputNames: inputNames,
          normalizedInputNames: inputNames.map(tokenizeAndSort),
          top3Matches: top3,
          bestMatch,
          bestMatchType: finalMatchType,
        },
        null,
        2,
      ),
    );

    fs.writeFileSync(
      path.join(outputDir, "consolidated.json"),
      JSON.stringify(
        {
          requestId,
          userId,
          finalResult: finalMatchType,
          matchedWatchlistId: bestMatch.watchlistId,
          score: bestMatch.score,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    log("Processing completed successfully", { requestId });
    res.json({ outputPath: outputDir });
  } catch (err) {
    log(`Error: ${err.message}`, { requestId });
    // Remove the output directory (if created) in case of an error
    if (fs.existsSync(outputDir)) {
      try {
        fs.rmSync(outputDir, { recursive: true, force: true });
        log("Cleaned up output directory due to error", { requestId });
      } catch (cleanupErr) {
        log(`Failed to cleanup output directory: ${cleanupErr.message}`, {
          requestId,
        });
      }
    }

    res
      .status(500)
      .json({ error: "Processing failed due to internal server error." });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
