const { handleComponent } = require('../handlers/componentHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        // Codice 40060: interaction già gestita da un altro processo — non è un errore reale
        if (err.code === 40060) {
          console.warn(`[GUARD] Interaction già gestita da altro processo: ${interaction.id}`);
          return;
        }
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
