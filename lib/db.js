"use strict";

const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "..", "data.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Untitled Design',
    data TEXT NOT NULL,
    final_prompt TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const columns = db.prepare("PRAGMA table_info(designs)").all();
if (!columns.some((c) => c.name === "type")) {
  db.exec("ALTER TABLE designs ADD COLUMN type TEXT NOT NULL DEFAULT 'poster'");
}

function listDesigns() {
  return db
    .prepare("SELECT id, name, type, created_at, updated_at FROM designs ORDER BY updated_at DESC, id DESC")
    .all();
}

function getDesign(id) {
  return db.prepare("SELECT * FROM designs WHERE id = ?").get(id);
}

function createDesign({ name, data, final_prompt, type }) {
  const info = db
    .prepare("INSERT INTO designs (name, data, final_prompt, type) VALUES (?, ?, ?, ?)")
    .run(name || "Untitled Design", JSON.stringify(data || {}), final_prompt || "", type || "poster");
  return getDesign(info.lastInsertRowid);
}

function updateDesign(id, { name, data, final_prompt, type }) {
  const current = getDesign(id);
  if (!current) return null;
  db.prepare(
    "UPDATE designs SET name = ?, data = ?, final_prompt = ?, type = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(
    name !== undefined ? name : current.name,
    JSON.stringify(data !== undefined ? data : JSON.parse(current.data)),
    final_prompt !== undefined ? final_prompt : current.final_prompt,
    type !== undefined ? type : current.type,
    id
  );
  return getDesign(id);
}

function deleteDesign(id) {
  db.prepare("DELETE FROM designs WHERE id = ?").run(id);
}

module.exports = { listDesigns, getDesign, createDesign, updateDesign, deleteDesign };
