const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI, isAlto, isInformativa } = require('../../utils/permissions');
const { formatMoney } = require('../../utils/formatters');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resoconto-settimana')
    .setDescription('Visualizza il resoconto della settimana corrente'),

  async execute(interaction) {
    const autorizzato =
      checkPermission(interaction.member, LIVELLI.RECLUTA) ||
      isInformativa(interaction.member) ||
      isAlto(interaction.member);

    if (!autorizzato) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi.')], ephemeral: true });
    }

    const res = db.prepare('SELECT * FROM resoconti WHERE membro_id = ?').get(interaction.user.id);

    if (!res || res.settimana_corrente_fatturato === 0) {
      return interaction.reply({
        embeds: [embedBase('📅 Resoconto Settimanale', 'Nessuna fattura emessa questa settimana.', config.colori.info)],
        ephemeral: true,
      });
    }

    const embed = embedBase(`📅 Resoconto Settimanale — ${interaction.user.username}`, null, config.colori.primario)
      .addFields(
        { name: '💰 Fatturato Settimana', value: formatMoney(res.settimana_corrente_fatturato), inline: true },
        { name: '💵 Stipendio Maturato (25%)', value: formatMoney(res.settimana_corrente_stipendio), inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
