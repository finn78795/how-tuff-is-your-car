import { gzipSync, gunzipSync } from "node:zlib";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL = "https://www.fueleconomy.gov/feg/epadata/vehicles.csv";
const OUTPUT_PATH = path.join(process.cwd(), "src/data/epa-catalog.json.gz");
const TIMEOUT_MS = Number(process.env.CATALOG_SYNC_TIMEOUT_MS || 45_000);
const KEEP_FIELDS = [
  "id", "year", "make", "model", "trany", "drive", "cylinders", "displ",
  "fuelType", "fuelType1", "VClass", "comb08", "city08", "highway08",
  "tCharger", "sCharger", "evMotor", "atvType", "eng_dscr", "basemodel",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  const indexes = Object.fromEntries(KEEP_FIELDS.map((field) => [field, headers.indexOf(field)]));
  return rows
    .filter((items) => items.length > 3)
    .map((items) => Object.fromEntries(KEEP_FIELDS.map((field) => [field, indexes[field] >= 0 ? items[indexes[field]] || "" : ""])))
    .filter((item) => item.id && item.year && item.make && item.model);
}

async function existingRowCount() {
  try {
    const compressed = await readFile(OUTPUT_PATH);
    const value = JSON.parse(gunzipSync(compressed).toString("utf8"));
    return Array.isArray(value) ? value.length : 0;
  } catch {
    return 0;
  }
}

async function main() {
  const before = await existingRowCount();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log(`Refreshing the FuelEconomy.gov vehicle snapshot${before ? ` (currently ${before.toLocaleString()} rows)` : ""}…`);
    const response = await fetch(SOURCE_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "HowTuffIsYourCar/2.0 (catalog sync)" },
    });
    if (!response.ok) throw new Error(`FuelEconomy.gov returned HTTP ${response.status}`);

    const rows = parseCsv(await response.text());
    if (rows.length < 10_000) throw new Error(`Only ${rows.length.toLocaleString()} rows were returned; keeping the existing snapshot.`);

    const compressed = gzipSync(Buffer.from(JSON.stringify(rows)), { level: 9 });
    await writeFile(OUTPUT_PATH, compressed);
    console.log(`Saved ${rows.length.toLocaleString()} vehicle configurations (${(compressed.length / 1024 / 1024).toFixed(2)} MB compressed).`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`Catalog sync skipped: ${reason}`);
    console.warn(before ? `Keeping the existing ${before.toLocaleString()}-row snapshot.` : "The app will use its bundled classics and fetch FuelEconomy.gov at runtime when available.");
  } finally {
    clearTimeout(timeout);
  }
}

await main();
