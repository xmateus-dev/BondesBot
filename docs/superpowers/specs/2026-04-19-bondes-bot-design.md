# Bondes Bot — Design Spec
**Data:** 2026-04-19  
**Progetto:** Bot Discord per fazione mafia GTA RP "Bondes"  
**Stack:** Node.js + discord.js v14 + SQLite (better-sqlite3) + dotenv + node-cron  
**Hosting:** Windows locale/VPS con pm2

---

## 1. Struttura Progetto

```
bondes-bot/
├── src/
│   ├── commands/
│   │   ├── utility/          → ping.js, help.js, setup-check.js
│   │   ├── tickets/          → ticketpanel.js
│   │   ├── richiami/         → richiamo.js, richiami-utente.js, rimuovi-richiamo.js
│   │   ├── fatture/          → fatture.js, resoconto.js, resoconto-mese.js,
│   │   │                        classifica-fatture.js, aggiusta-stipendio.js,
│   │   │                        azzera-resoconto.js
│   │   ├── campi/            → campi.js
│   │   ├── rapine/           → rapine.js
│   │   ├── schedamenti/      → schedamenti.js, cerca-schedamento.js,
│   │   │                        lista-schedamenti.js
│   │   ├── assenze/          → assenze.js, lista-assenze.js, chiudi-assenza.js
│   │   └── economia/         → economia-aggiungi.js, economia-rimuovi.js,
│   │                            economia-saldo.js, economia-storico.js
│   ├── events/
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   └── guildMemberAdd.js
│   ├── handlers/
│   │   ├── commandHandler.js
│   │   ├── eventHandler.js
│   │   └── componentHandler.js
│   ├── database/
│   │   ├── index.js          → connessione SQLite singleton
│   │   └── schema.js         → creazione tabelle + migrations
│   ├── utils/
│   │   ├── embeds.js         → factory embed standard (colori, footer, stile)
│   │   ├── permissions.js    → checkPermission(member, level)
│   │   ├── logger.js         → log canale Discord + console
│   │   └── formatters.js     → formattazione date, importi, liste membri
│   ├── components/
│   │   ├── ticketButtons.js  → pulsanti apri/chiudi ticket
│   │   └── ticketSelect.js   → select menu tipo ticket
│   ├── config/
│   │   └── config.js         → legge .env, valida campi obbligatori, esporta oggetto config
│   ├── tasks/
│   │   └── stipendioMensile.js → cron job 1° del mese ore 09:00
│   └── index.js              → entry point: carica handler, avvia bot, avvia cron
├── data/
│   └── bondes.db
├── scripts/
│   └── deploy-commands.js
├── .env
├── .env.example
├── package.json
└── ecosystem.config.js
```

---

## 2. Database Schema

### `tickets`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
tipo TEXT NOT NULL,              -- 'braccio-armato' | 'informativa'
canale_id TEXT NOT NULL,
utente_id TEXT NOT NULL,
stato TEXT DEFAULT 'aperto',     -- 'aperto' | 'chiuso'
data_apertura TEXT NOT NULL,
data_chiusura TEXT,
numero_progressivo INTEGER
```

### `richiami`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
utente_id TEXT NOT NULL,
staff_id TEXT NOT NULL,
numero INTEGER NOT NULL,         -- 1, 2, 3
motivo TEXT NOT NULL,
note TEXT,
data TEXT NOT NULL
```

### `fatture`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
cliente_nome TEXT NOT NULL,
tipo TEXT NOT NULL,
importo REAL NOT NULL,
membro_id TEXT NOT NULL,
note TEXT,
data TEXT NOT NULL
```

### `resoconti`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
membro_id TEXT UNIQUE NOT NULL,
fatturato_totale REAL DEFAULT 0,
stipendio_totale REAL DEFAULT 0,     -- 25% cumulativo storico
quota_fazione_totale REAL DEFAULT 0, -- 75% cumulativo storico
fatture_count INTEGER DEFAULT 0,
settimana_corrente_fatturato REAL DEFAULT 0,
settimana_corrente_stipendio REAL DEFAULT 0,
ultimo_importo REAL,
ultima_data TEXT
```

### `stipendi_log`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
membro_id TEXT NOT NULL,
importo REAL NOT NULL,
tipo TEXT NOT NULL,              -- 'aggiunta' | 'rimozione' | 'reset' | 'pagamento'
motivo TEXT,
staff_id TEXT NOT NULL,
data TEXT NOT NULL
```

### `campi`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
campo TEXT NOT NULL,
attivita TEXT NOT NULL,          -- 'raccolta' | 'processo'
esito TEXT NOT NULL,             -- 'positivo' | 'negativo'
pezzi TEXT NOT NULL,
membri TEXT NOT NULL,
autore_id TEXT NOT NULL,
note TEXT,
data TEXT NOT NULL
```

### `rapine`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
civico TEXT NOT NULL,
tipo TEXT NOT NULL,
esito TEXT NOT NULL,             -- 'positivo' | 'negativo'
membri TEXT NOT NULL,
bottino TEXT,
autore_id TEXT NOT NULL,
note TEXT,
data TEXT NOT NULL
```

### `schedamenti`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
nome TEXT NOT NULL,
cognome TEXT NOT NULL,
eta TEXT NOT NULL,
provenienza TEXT NOT NULL,
ruolo TEXT NOT NULL,
pericolosita TEXT NOT NULL,
veicolo TEXT,
stato TEXT NOT NULL,             -- 'attenzionato' | 'affidabile' | 'sospetto' | 'ostile'
note TEXT,
autore_id TEXT NOT NULL,
data TEXT NOT NULL
```

### `assenze`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
membro_id TEXT NOT NULL,
staff_id TEXT NOT NULL,
motivo TEXT NOT NULL,
dal_giorno TEXT NOT NULL,
al_giorno TEXT NOT NULL,
stato TEXT DEFAULT 'aperta',     -- 'aperta' | 'chiusa'
data_chiusura TEXT
```

### `economia`
```sql
id INTEGER DEFAULT 1,
saldo_totale REAL DEFAULT 0
```

### `economia_log`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
tipo TEXT NOT NULL,              -- 'entrata' | 'uscita'
importo REAL NOT NULL,
categoria TEXT NOT NULL,
motivo TEXT NOT NULL,
membro_id TEXT,
data TEXT NOT NULL
```

---

## 3. Sistema Permessi

Implementato in `utils/permissions.js` con funzione `checkPermission(member, requiredLevel)`.

```
LIVELLO 0 — Tutti (inclusi nuovi senza ruolo fazione)
  /ticketpanel (aprire ticket), /ping, /help

LIVELLO 1 — Tutti i membri con qualsiasi ruolo fazione
  /resoconto (solo il proprio)
  /assenze (registrare la propria assenza)

LIVELLO 2A — Recluta
  /fatture, /resoconto-mese, /classifica-fatture

LIVELLO 2B — Informativa + G.Informativa
  /fatture, /resoconto (anche altri), /schedamenti,
  /cerca-schedamento, /lista-schedamenti

LIVELLO 2C — Braccio Armato + G.Braccio
  /campi, /rapine

LIVELLO 3 — Ruoli Alti (Boss, Vice Boss, Staff)
  Tutto il Livello 2 +
  /richiamo, /rimuovi-richiamo, /richiami-utente
  /economia-aggiungi, /economia-rimuovi
  /aggiusta-stipendio, /azzera-resoconto
  /economia-saldo, /economia-storico
  /lista-assenze, /chiudi-assenza
  /setup-check
```

Errori permessi: embed ephemeral, nessun crash.

---

## 4. Sistema Fatture + Stipendi

- Ogni fattura registrata aggiorna automaticamente:
  1. `resoconti.fatturato_totale` del membro
  2. `resoconti.stipendio_totale` (+25% dell'importo)
  3. `resoconti.quota_fazione_totale` (+75%)
  4. `resoconti.settimana_corrente_fatturato` e `settimana_corrente_stipendio`
  5. `economia.saldo_totale` (+75%)
  6. Un record in `stipendi_log`

- Ogni lunedì alle 09:00 il cron job:
  1. Preleva tutti i resoconti con `settimana_corrente_stipendio > 0`
  2. Invia embed nel canale `stipendi` con la lista pagamenti da effettuare
  3. Azzera `settimana_corrente_fatturato` e `settimana_corrente_stipendio` per tutti

---

## 5. Sistema Ticket

- Numerazione progressiva per tipo derivata con `MAX(numero_progressivo) WHERE tipo = X` dalla tabella `tickets`
- Nomi canali: `informativa-001`, `braccio-armato-001`, ecc.
- Un utente non può aprire più ticket dello stesso tipo simultaneamente
- Chiusura ticket: embed riassuntivo (tipo B) — primo messaggio, durata, numero messaggi stimato
- Permessi canale: solo creatore + ruoli pertinenti al tipo ticket + ruoli alti

---

## 6. Automazioni

### Cron Stipendi Settimanali
- **Scheduler:** `node-cron`
- **Trigger:** `0 9 * * 1` (ogni lunedì ore 09:00)
- **Azione:** embed nel canale `stipendi`, poi reset contatori settimanali

---

## 7. Stile Embed

- Colore primario: `#1a1a2e` (blu notte scuro)
- Colore successo: `#16213e`
- Colore errore: `#c0392b`
- Colore warning: `#e67e22`
- Footer: `Bondes — Sistema Interno` + timestamp
- Tutti i testi in italiano, tono formale/organizzativo

---

## 8. Config (.env)

```
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=

# Canali
CH_TICKET=
CH_TICKET_LOG=
CH_RICHIAMI_LOG=
CH_FATTURE=
CH_ESITO_CAMPI=
CH_ESITO_RAPINE=
CH_SCHEDAMENTI=
CH_ASSENZE=
CH_ECONOMIA=
CH_BOT_LOG=
CH_STIPENDI=

# Ruoli
ROLE_BOSS=
ROLE_VICE_BOSS=
ROLE_STAFF=
ROLE_BRACCIO_ARMATO=
ROLE_G_BRACCIO=
ROLE_INFORMATIVA=
ROLE_G_INFORMATIVA=
ROLE_RECLUTA=
ROLE_RICHIAMO_1=
ROLE_RICHIAMO_2=
ROLE_RICHIAMO_3=
```

---

## 9. Error Handling

- Ogni comando: try/catch con risposta ephemeral in caso di errore
- Canale mancante: log console warning, comando continua senza crashare
- Ruolo mancante: log console warning, messaggio di errore all'utente
- DB error: log dettagliato, risposta generica all'utente
- Unhandled rejections: catturate in `index.js` con log

---

## 10. Deploy Windows

- `npm start` → avvia il bot direttamente
- `pm2 start ecosystem.config.js` → avvia con pm2 (restart automatico)
- `node scripts/deploy-commands.js` → registra/aggiorna slash commands
- Backup database: copia manuale di `data/bondes.db`
