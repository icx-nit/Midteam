import Database from 'better-sqlite3'

const db = new Database('app.db', {
  verbose: console.log
})


db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    firstname TEXT,
    lastname TEXT
  )
`)

export default db

