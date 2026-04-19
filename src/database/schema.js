const db = require("./index");

function initDatabase() {
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      canale_id TEXT NOT NULL,
      utente_id TEXT NOT NULL,
      stato TEXT DEFAULT "aperto",
      data_apertura TEXT NOT NULL,
      data_chiusura TEXT,
      numero_progressivo INTEGER
    );
    CREATE TABLE IF NOT EXISTS richiami (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id TEXT NOT NULL,
      staff_id TEXT NOT NULL,
      numero INTEGER NOT NULL,
      motivo TEXT NOT NULL,
      note TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fatture (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_nome TEXT NOT NULL,
      tipo TEXT NOT NULL,
      importo REAL NOT NULL,
      membro_id TEXT NOT NULL,
      note TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS resoconti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membro_id TEXT UNIQUE NOT NULL,
      fatturato_totale REAL DEFAULT 0,
      stipendio_totale REAL DEFAULT 0,
      quota_fazione_totale REAL DEFAULT 0,
      fatture_count INTEGER DEFAULT 0,
      settimana_corrente_fatturato REAL DEFAULT 0,
      settimana_corrente_stipendio REAL DEFAULT 0,
      ultimo_importo REAL,
      ultima_data TEXT
    );
    CREATE TABLE IF NOT EXISTS stipendi_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membro_id TEXT NOT NULL,
      importo REAL NOT NULL,
      tipo TEXT NOT NULL,
      motivo TEXT,
      staff_id TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS campi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campo TEXT NOT NULL,
      attivita TEXT NOT NULL,
      esito TEXT NOT NULL,
      pezzi TEXT NOT NULL,
      membri TEXT NOT NULL,
      autore_id TEXT NOT NULL,
      note TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rapine (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      civico TEXT NOT NULL,
      tipo TEXT NOT NULL,
      esito TEXT NOT NULL,
      membri TEXT NOT NULL,
      bottino TEXT,
      autore_id TEXT NOT NULL,
      note TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS schedamenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      eta TEXT NOT NULL,
      provenienza TEXT NOT NULL,
      ruolo TEXT NOT NULL,
      pericolosita TEXT NOT NULL,
      veicolo TEXT,
      stato TEXT NOT NULL,
      note TEXT,
      autore_id TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assenze (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membro_id TEXT NOT NULL,
      staff_id TEXT NOT NULL,
      motivo TEXT NOT NULL,
      dal_giorno TEXT NOT NULL,
      al_giorno TEXT NOT NULL,
      stato TEXT DEFAULT "aperta",
      data_chiusura TEXT
    );
    CREATE TABLE IF NOT EXISTS economia (
      id INTEGER PRIMARY KEY DEFAULT 1,
      saldo_totale REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS economia_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      importo REAL NOT NULL,
      categoria TEXT NOT NULL,
      motivo TEXT NOT NULL,
      membro_id TEXT,
      data TEXT NOT NULL
    );
  `;
  db.exec(sql);

  const eco = db.prepare("SELECT id FROM economia WHERE id = 1").get();
  if (!eco) {
    db.prepare("INSERT INTO economia (id, saldo_totale) VALUES (1, 0)").run();
  }
  console.log("[DB] Database inizializzato correttamente.");
}

module.exports = { initDatabase };
