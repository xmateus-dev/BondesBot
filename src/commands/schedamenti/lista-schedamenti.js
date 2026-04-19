const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { isInformativa } = require('../../utils/permissions');
const { formatDate } = require('../../utils/formatters');
const config = require('../../config/config');

const STATO_EMOJI = { attenzionato: '👁️', affidabile: '✅', sospetto: '⚠️', ostile: '🔴' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lista-schedamenti')
    .setDescription('Mostra gli ultimi schedamenti nell\'archivio')
    .addStringOption(o => o.setName('stato').setDescription('Filtra per stato (facoltativo)').setRequired(false)
      .addChoices(
        { name: '👁️ Attenzionato', value: 'attenzionato' },
        { name: '✅ Affidabile', value: 'affidabile' },
        { name: '⚠️ Sospetto', value: 'sospetto' },
        { name: '🔴 Ostile', value: 'ostile' }
      )),

  async execute(interaction) {
    if (!isInformativa(interaction.member)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per accedere all\'archivio.')], ephemeral: true });
    }

    const filtroStato = interaction.options.getString('stato');
    const schede = filtroStato
      ? db.prepare('SELECT * FROM schedamenti WHERE stato = ? ORDER BY id DESC LIMIT 10').all(filtroStato)
      : db.prepare('SELECT * FROM schedamenti ORDER BY id DESC LIMIT 10').all();

    if (schede.length === 0) {
      return interaction.reply({
        embeds: [embedBase('📂 Archivio Vuoto', 'Nessuno schedamento trovato.', config.colori.info)],
        ephemeral: true,
      });
    }

    const filtroLabel = filtroStato ? ` (${filtroStato})` : '';
    const righe = schede.map(r => {
      const emoji = STATO_EMOJI[r.stato] || '❓';
      return `${emoji} **#${r.id} — ${r.nome} ${r.cognome}** | ${r.ruolo} | ${formatDate(r.data)}`;
    }).join('\n');

    const embed = embedBase(`📂 Archivio Schedamenti${filtroLabel}`, righe, config.colori.primario);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
