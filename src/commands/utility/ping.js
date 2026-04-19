const { SlashCommandBuilder } = require('discord.js');
const { embedInfo } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Controlla la latenza del bot'),

  async execute(interaction) {
    const latency = Date.now() - interaction.createdTimestamp;
    const embed = embedInfo(
      '📡 Stato Sistema',
      `**Latenza:** ${latency}ms\n**WebSocket:** ${interaction.client.ws.ping}ms`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
