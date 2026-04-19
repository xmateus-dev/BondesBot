const { handleComponent } = require('../handlers/componentHandler');

// Guard anti-duplicato: se lo stesso interactionId arriva due volte (es. due
// processi con lo stesso token), blocca il secondo prima che esegua qualsiasi send.
const processed = new Set();

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (processed.has(interaction.id)) {
      console.warn(`[GUARD] Interaction duplicata bloccata: ${interaction.id}`);
      return;
    }
    processed.add(interaction.id);
    // Pulisce le entry dopo 10 secondi per non accumulare memoria
    setTimeout(() => processed.delete(interaction.id), 10_000);

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
