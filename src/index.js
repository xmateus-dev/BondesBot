require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { initDatabase } = require('./database/schema');
const { avviaStipendioSettimanale } = require('./tasks/stipendioSettimanale');
const config = require('./config/config');

process.on('unhandledRejection', err => {
  console.error('[ERRORE] UnhandledRejection:', err);
});
process.on('uncaughtException', err => {
  console.error('[ERRORE] UncaughtException:', err);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

initDatabase();
loadCommands(client);
loadEvents(client);
avviaStipendioSettimanale(client);

client.login(config.token);

const db = require('./database');
