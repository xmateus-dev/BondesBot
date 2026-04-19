const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI, isAlto, isInformativa } = require('../../utils/permissions');
const { formatMoney, formatDate } = require('../../utils/formatters');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resoconto')
    .setDescription('Visualizza il resoconto personale fatture e stipendio')
    .addUserOption(o => o.setName('membro').setDescription('Membro da visualizzare (solo ruoli autorizzati)').setRequired(false)),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.MEMBRO)) {
      return interaction.reply({ embeds: [embedErrore('Devi essere un membro della fazione.')], ephemeral: true });
    }

    const targetOption = interaction.options.getMember('membro');
    const puoVedereAltri = isAlto(interaction.member) || isInformativa(interaction.member);

    let target = interaction.member;
    if (targetOption && targetOption.id !== interaction.user.id) {
      if (!puoVedereAltri) {
        return interaction.reply({ embeds: [embedErrore('Non hai i permessi per vedere il resoconto di altri membri.')], ephemeral: true });
      }
      target = targetOption;
    }

    const res = db.prepare('SELECT * FROM resoconti WHERE membro_id = ?').get(target.id);

    if (!res) {
      return interaction.reply({
        embeds: [embedBase('📊 Resoconto', `${target} non ha ancora emesso fatture.`, config.colori.info)],
        ephemeral: true,
      });
    }

    const media = res.fatture_count > 0 ? res.fatturato_totale / res.fatture_count : 0;

    const embed = embedBase(`📊 Resoconto — ${target.user.username}`, null, config.colori.primario)
      .addFields(
        { name: '💰 Fatturato Totale', value: formatMoney(res.fatturato_totale), inline: true },
        { name: '📄 Fatture Emesse', value: `${res.fatture_count}`, inline: true },
        { name: '📈 Media per Fattura', value: formatMoney(media), inline: true },
        { name: '💵 Stipendio Accumulato (25%)', value: formatMoney(res.stipendio_totale), inline: true },
        { name: '🏛️ Quota Fazione (75%)', value: formatMoney(res.quota_fazione_totale), inline: true },
        { name: '📅 Settimana Corrente', value: formatMoney(res.settimana_corrente_fatturato), inline: true },
        { name: '💸 Stipendio Sett. Corrente', value: formatMoney(res.settimana_corrente_stipendio), inline: true },
        { name: '💳 Ultimo Importo', value: res.ultimo_importo ? formatMoney(res.ultimo_importo) : 'N/D', inline: true },
        { name: '🕐 Ultima Fattura', value: res.ultima_data ? formatDate(res.ultima_data) : 'N/D', inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
