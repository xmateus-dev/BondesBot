const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI, isBraccio } = require('../../utils/permissions');
const { logBotLog } = require('../../utils/logger');
const { formatDate } = require('../../utils/formatters');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('campi')
    .setDescription('Registra un esito campo')
    .addStringOption(o => o.setName('campo').setDescription('Nome del campo').setRequired(true))
    .addStringOption(o => o.setName('attivita').setDescription('Tipo di attività').setRequired(true)
      .addChoices(
        { name: '🌾 Raccolta', value: 'raccolta' },
        { name: '⚙️ Processo', value: 'processo' }
      ))
    .addStringOption(o => o.setName('esito').setDescription('Esito dell\'operazione').setRequired(true)
      .addChoices(
        { name: '✅ Positivo', value: 'positivo' },
        { name: '❌ Negativo', value: 'negativo' }
      ))
    .addStringOption(o => o.setName('pezzi').setDescription('Numero di pezzi').setRequired(true))
    .addStringOption(o => o.setName('membri').setDescription('Membri partecipanti').setRequired(true))
    .addStringOption(o => o.setName('note').setDescription('Note facoltative').setRequired(false)),

  async execute(interaction) {
    if (!isBraccio(interaction.member)) {
      return interaction.reply({ embeds: [embedErrore('Solo il Braccio Armato può registrare esiti campo.')], ephemeral: true });
    }

    const campo = interaction.options.getString('campo');
    const attivita = interaction.options.getString('attivita');
    const esito = interaction.options.getString('esito');
    const pezzi = interaction.options.getString('pezzi');
    const membri = interaction.options.getString('membri');
    const note = interaction.options.getString('note') || null;
    const data = new Date().toISOString();

    db.prepare('INSERT INTO campi (campo, attivita, esito, pezzi, membri, autore_id, note, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(campo, attivita, esito, pezzi, membri, interaction.user.id, note, data);

    const esitoEmoji = esito === 'positivo' ? '✅' : '❌';
    const colore = esito === 'positivo' ? config.colori.successo : config.colori.errore;
    const attivitaLabel = attivita === 'raccolta' ? '🌾 Raccolta' : '⚙️ Processo';

    const embed = embedBase(`${esitoEmoji} Esito Campo — ${campo}`, null, colore)
      .addFields(
        { name: '📍 Campo', value: campo, inline: true },
        { name: '⚙️ Attività', value: attivitaLabel, inline: true },
        { name: '📦 Pezzi', value: pezzi, inline: true },
        { name: '👥 Membri', value: membri, inline: false },
        { name: '📝 Note', value: note || 'Nessuna', inline: false },
        { name: '🕐 Data', value: formatDate(data), inline: true },
        { name: '👤 Compilato da', value: `${interaction.member}`, inline: true }
      );

    const chCampi = config.canali.esitoCampi;
    if (chCampi) {
      const canale = await interaction.client.channels.fetch(chCampi).catch(() => null);
      if (canale) {
        await canale.send({ embeds: [embed] });
        await interaction.reply({ content: `${esitoEmoji} Esito campo registrato con successo!`, ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    } else {
      await interaction.reply({ embeds: [embed] });
    }
    await logBotLog(interaction.client, `${esitoEmoji} Campo Registrato`,
      `**Campo:** ${campo} | **Attività:** ${attivita} | **Esito:** ${esito} | **Da:** ${interaction.user.tag}`
    );
  },
};
