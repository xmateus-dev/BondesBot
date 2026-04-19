const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { formatMoney, formatDate } = require('../../utils/formatters');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economia-storico')
    .setDescription('Mostra gli ultimi movimenti economici della fazione'),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per visualizzare lo storico.')], ephemeral: true });
    }

    const movimenti = db.prepare('SELECT * FROM economia_log ORDER BY id DESC LIMIT 15').all();

    if (movimenti.length === 0) {
      return interaction.reply({
        embeds: [embedBase('📒 Storico Economico', 'Nessun movimento registrato.', config.colori.info)],
        ephemeral: true,
      });
    }

    const righe = movimenti.map(m => {
      const simbolo = m.tipo === 'entrata' ? '📈 +' : '📉 -';
      const chi = m.membro_id ? `<@${m.membro_id}>` : 'Sistema';
      return `${simbolo}**${formatMoney(m.importo)}** | ${m.categoria}\n┣ ${m.motivo}\n┗ ${chi} • ${formatDate(m.data)}`;
    }).join('\n\n');

    const embed = embedBase('📒 Storico Economico — Ultimi 15', righe, config.colori.primario);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
