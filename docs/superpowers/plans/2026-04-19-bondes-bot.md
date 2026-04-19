# Bondes Bot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire un bot Discord completo per la fazione mafia GTA RP "Bondes" con 10 sistemi operativi, permessi per ruolo, database SQLite e automazioni settimanali.

**Architecture:** Struttura modulare feature-based — ogni sistema ha la propria cartella comandi. Un command handler e un event handler centralizzati caricano tutto dinamicamente. Utility condivise (embeds, permessi, logger, formatter) usate da tutti i moduli.

**Tech Stack:** Node.js 20 LTS, discord.js v14, better-sqlite3, dotenv, node-cron, pm2 (Windows)

---

## Task 1: Setup progetto
## Task 2: Config e Database  
## Task 3: Utility condivise
## Task 4: Handlers e Entry Point
## Task 5: Deploy script e comandi utility
## Task 6: Sistema Ticket
## Task 7: Sistema Richiami
## Task 8: Sistema Fatture + Resoconto + Stipendi
## Task 9: Campi e Rapine
## Task 10: Schedamenti
## Task 11: Assenze
## Task 12: Economia Interna
## Task 13: Avvio e Deploy

Piano completo — vedi implementazione inline.
