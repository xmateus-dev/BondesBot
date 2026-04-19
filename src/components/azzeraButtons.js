const azzeraCmd = require('../commands/fatture/azzera-resoconto');

module.exports = {
  ids: ['azzera_confirm_', 'azzera_cancel_'],

  async execute(interaction) {
    if (interaction.customId.startsWith('azzera_confirm_')) {
      const key = interaction.customId.replace('azzera_confirm_', '');
      await azzeraCmd.handleConfirm(interaction, key);
    } else if (interaction.customId.startsWith('azzera_cancel_')) {
      await azzeraCmd.handleCancel(interaction);
    }
  },
};
