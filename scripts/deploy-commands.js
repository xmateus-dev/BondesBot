require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, '../src/commands');
const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const folderPath = path.join(commandsPath, folder);
  if (!fs.statSync(folderPath).isDirectory()) continue;
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = require(path.join(folderPath, file));
    if (cmd.data) {
      commands.push(cmd.data.toJSON());
      console.log(`[DEPLOY] Trovato: /${cmd.data.name}`);
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`[DEPLOY] Registrazione di ${commands.length} comandi...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('[DEPLOY] Comandi registrati con successo.');
  } catch (err) {
    console.error('[DEPLOY] Errore durante la registrazione:', err);
  }
})();
