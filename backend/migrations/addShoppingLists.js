import fs from "fs";
import path from "path";

// ---------- CONFIG ----------
const dbPath = './db.json';               // Path to your JSON DB
// -----------------------------

// Step 2: Load the JSON DB
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Step 3: Add books to db
if (!db.shoppingLists) {
  db.shoppingLists = [];
}

// Step 4: Write back updated JSON
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log('db.json has been updated to include shoppingLists entry.');