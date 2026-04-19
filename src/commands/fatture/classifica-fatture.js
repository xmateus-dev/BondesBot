const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI, isAlto, isInformativa } = require('../../utils/permissions');
const { formatMoney } = require('../../utils/formatters');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('classifica-fatture')
    .setDescription('Mostra la classifica dei membri per fatturato'),

  async execute(interaction) {
    const autorizzato =
      checkPermission(interaction.member, LIVELLI.RECLUTA) ||
      isInformativa(interaction.member) ||
      isAlto(interaction.member);

    if (!autorizzato) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi.')], ephemeral: true });
    }

    const top = db.prepare('SELECT * FROM resoconti ORDER BY fatturato_totale DESC LIMIT 10').all();

    if (top.length === 0) {
      return interaction.reply({
        embeds: [embedBase('🏆 Classifica', 'Nessun dato disponibile.', config.colori.info)],
        ephemeral: true,
      });
    }

    const righe = top.map((r, i) => {
      const medaglia = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
      return `${medaglia} <@${r.membro_id}>\n┣ Fatturato: ${formatMoney(r.fatturato_totale)} (${r.fatture_count} fatture)\n┗ Stipendio: ${formatMoney(r.stipendio_totale)}`;
    }).join('\n\n');

    const embed = embedBase('🏆 Classifica Fatture — Bondes', righe, config.colori.primario);
    await interaction.reply({ embeds: [embed] });
  },
};
