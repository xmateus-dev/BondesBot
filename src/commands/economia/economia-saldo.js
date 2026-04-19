const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { formatMoney } = require('../../utils/formatters');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economia-saldo')
    .setDescription('Visualizza il saldo attuale dell\'economia fazione'),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per visualizzare il saldo.')], ephemeral: true });
    }

    const eco = db.prepare('SELECT saldo_totale FROM economia WHERE id = 1').get();
    const saldo = eco ? eco.saldo_totale : 0;

    const totalEntrate = db.prepare('SELECT COALESCE(SUM(importo), 0) as t FROM economia_log WHERE tipo = ?').get('entrata').t;
    const totalUscite = db.prepare('SELECT COALESCE(SUM(importo), 0) as t FROM economia_log WHERE tipo = ?').get('uscita').t;
    const totMovimenti = db.prepare('SELECT COUNT(*) as c FROM economia_log').get().c;

    const embed = embedBase('🏦 Economia Fazione — Bondes', null, config.colori.primario)
      .addFields(
        { name: '💰 Saldo Attuale', value: formatMoney(saldo), inline: false },
        { name: '📈 Entrate Totali', value: formatMoney(totalEntrate), inline: true },
        { name: '📉 Uscite Totali', value: formatMoney(totalUscite), inline: true },
        { name: '📊 Movimenti Totali', value: `${totMovimenti}`, inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
