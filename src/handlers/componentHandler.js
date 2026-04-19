const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

let components = null;

function loadComponents() {
  components = new Collection();
  const compPath = path.join(__dirname, '../components');
  const files = fs.readdirSync(compPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const comp = require(path.join(compPath, file));
    if (Array.isArray(comp.ids)) {
      for (const id of comp.ids) {
        components.set(id, comp);
      }
    } else if (comp.id) {
      components.set(comp.id, comp);
    }
  }
}

async function handleComponent(interaction) {
  if (!components) loadComponents();

  // Cerca corrispondenza esatta o per prefisso
  let handler = components.get(interaction.customId);
  if (!handler) {
    for (const [key, comp] of components.entries()) {
      if (interaction.customId.startsWith(key)) {
        handler = comp;
        break;
      }
    }
  }

  if (!handler) return;

  try {
    await handler.execute(interaction);
  } catch (err) {
    console.error('[COMP] Errore componente:', err);
    const msg = { content: '❌ Errore durante l\'elaborazione.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
}

module.exports = { loadComponents, handleComponent };
