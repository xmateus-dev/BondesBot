const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '../commands');
  const folders = fs.readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const command = require(path.join(folderPath, file));
      if (!command.data || !command.execute) {
        console.warn(`[CMD] File non valido saltato: ${file}`);
        continue;
      }
      client.commands.set(command.data.name, command);
      console.log(`[CMD] Caricato: /${command.data.name}`);
    }
  }
}

module.exports = { loadCommands };
