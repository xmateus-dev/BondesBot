const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { isInformativa } = require('../../utils/permissions');
const { formatDate } = require('../../utils/formatters');
const config = require('../../config/config');

const STATO_EMOJI = { attenzionato: '👁️', affidabile: '✅', sospetto: '⚠️', ostile: '🔴' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cerca-schedamento')
    .setDescription('Cerca una scheda nell\'archivio per nome o cognome')
    .addStringOption(o => o.setName('query').setDescription('Nome o cognome da cercare').setRequired(true)),

  async execute(interaction) {
    if (!isInformativa(interaction.member)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per accedere all\'archivio.')], ephemeral: true });
    }

    const queryRaw = interaction.options.getString('query');
    const query = `%${queryRaw}%`;
    const risultati = db.prepare(
      'SELECT * FROM schedamenti WHERE nome LIKE ? OR cognome LIKE ? ORDER BY id DESC LIMIT 5'
    ).all(query, query);

    if (risultati.length === 0) {
      return interaction.reply({
        embeds: [embedBase('🔍 Nessun Risultato', `Nessuna scheda trovata per "${queryRaw}".`, config.colori.info)],
        ephemeral: true,
      });
    }

    const righe = risultati.map(r => {
      const emoji = STATO_EMOJI[r.stato] || '❓';
      return `${emoji} **#${r.id} — ${r.nome} ${r.cognome}**\n┣ Stato: ${r.stato} | Ruolo: ${r.ruolo}\n┗ Schedato: ${formatDate(r.data)}`;
    }).join('\n\n');

    const embed = embedBase(`🔍 Risultati per "${queryRaw}"`, righe, config.colori.primario);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
