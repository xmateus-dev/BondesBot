const azzeraSchedCmd = require('../commands/schedamenti/azzera-schedamenti');

module.exports = {
  ids: ['azzera_sched_confirm_', 'azzera_sched_cancel_'],

  async execute(interaction) {
    if (interaction.customId.startsWith('azzera_sched_confirm_')) {
      const key = interaction.customId.replace('azzera_sched_confirm_', '');
      await azzeraSchedCmd.handleConfirm(interaction, key);
    } else if (interaction.customId.startsWith('azzera_sched_cancel_')) {
      await azzeraSchedCmd.handleCancel(interaction);
    }
  },
};
