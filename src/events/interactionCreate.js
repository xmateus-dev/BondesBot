const { handleComponent } = require('../handlers/componentHandler');
const db = require('../database/index');

// Deduplication su SQLite: funziona anche tra processi separati sullo stesso DB.
// INSERT OR IGNORE restituisce changes=0 se l'ID esiste già → secondo processo bloccato.
function claimInteraction(id) {
  const ts = Date.now();
  const result = db.prepare(
    'INSERT OR IGNORE INTO interactions_processed (interaction_id, ts) VALUES (?, ?)'
  ).run(id, ts);
  // Pulisce entry più vecchie di 30 secondi
  db.prepare('DELETE FROM interactions_processed WHERE ts < ?').run(ts - 30_000);
  return result.changes > 0; // true = questo processo l'ha "vinta"
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!claimInteraction(interaction.id)) {
      console.warn(`[GUARD] Interaction duplicata bloccata (DB): ${interaction.id}`);
      return;
    }

    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      console.log(`[CMD] Eseguo /${interaction.commandName} — interaction ${interaction.id}`);
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[CMD] Errore /${interaction.commandName}:`, err);
        const msg = { content: '❌ Si è verificato un errore interno.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      await handleComponent(interaction);
    }
  },
};
