const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { embedBase } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Invia il pannello ticket nel canale corrente'),

  async execute(interaction) {
    const embed = embedBase(
      '🎫 Sistema Ticket — Bondes',
      'Seleziona il tipo di ticket che vuoi aprire dal menu qui sotto.\n\nLo staff ti risponderà al più presto.',
      config.colori.primario
    ).addFields(
      { name: '📂 Informativa', value: 'Richieste, informazioni, segnalazioni generali', inline: true },
      { name: '🔫 Braccio Armato', value: 'Operazioni, supporto operativo, richieste interne', inline: true }
    );

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_select')
        .setPlaceholder('Seleziona il tipo di ticket...')
        .addOptions([
          {
            label: 'Informativa',
            description: 'Richieste e informazioni generali',
            value: 'informativa',
            emoji: '📂',
          },
          {
            label: 'Braccio Armato',
            description: 'Operazioni e supporto operativo',
            value: 'braccio-armato',
            emoji: '🔫',
          },
        ])
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
