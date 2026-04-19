const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { isBraccio } = require('../../utils/permissions');
const { logBotLog } = require('../../utils/logger');
const { formatDate } = require('../../utils/formatters');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rapine')
    .setDescription('Registra un esito rapina')
    .addStringOption(o => o.setName('civico').setDescription('Civico/Indirizzo del target').setRequired(true))
    .addStringOption(o => o.setName('tipo').setDescription('Tipo di rapina').setRequired(true)
      .addChoices(
        { name: 'Negozietto', value: 'Negozietto' },
        { name: 'Fleeca', value: 'Fleeca' },
        { name: 'Atm', value: 'Atm' },
        { name: 'Pacific', value: 'Pacific' },
        { name: 'Gabriela', value: 'Gabriela' }
      ))
    .addStringOption(o => o.setName('esito').setDescription('Esito dell\'operazione').setRequired(true)
      .addChoices(
        { name: '✅ Positivo', value: 'positivo' },
        { name: '❌ Negativo', value: 'negativo' }
      ))
    .addStringOption(o => o.setName('membri').setDescription('Membri partecipanti').setRequired(true))
    .addStringOption(o => o.setName('bottino').setDescription('Bottino ottenuto (facoltativo)').setRequired(false))
    .addStringOption(o => o.setName('note').setDescription('Note facoltative').setRequired(false)),

  async execute(interaction) {
    if (!isBraccio(interaction.member)) {
      return interaction.reply({ embeds: [embedErrore('Solo il Braccio Armato può registrare esiti rapina.')], ephemeral: true });
    }

    const civico = interaction.options.getString('civico');
    const tipo = interaction.options.getString('tipo');
    const esito = interaction.options.getString('esito');
    const membri = interaction.options.getString('membri');
    const bottino = interaction.options.getString('bottino') || null;
    const note = interaction.options.getString('note') || null;
    const data = new Date().toISOString();

    db.prepare('INSERT INTO rapine (civico, tipo, esito, membri, bottino, autore_id, note, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(civico, tipo, esito, membri, bottino, interaction.user.id, note, data);

    const esitoEmoji = esito === 'positivo' ? '✅' : '❌';
    const colore = esito === 'positivo' ? config.colori.successo : config.colori.errore;

    const embed = embedBase(`${esitoEmoji} Esito Rapina — ${tipo}`, null, colore)
      .addFields(
        { name: '📍 Civico', value: civico, inline: true },
        { name: '🔫 Tipo', value: tipo, inline: true },
        { name: '💰 Bottino', value: bottino || 'Non specificato', inline: true },
        { name: '👥 Membri', value: membri, inline: false },
        { name: '📝 Note', value: note || 'Nessuna', inline: false },
        { name: '🕐 Data', value: formatDate(data), inline: true },
        { name: '👤 Compilato da', value: `${interaction.member}`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
    await logBotLog(interaction.client, `${esitoEmoji} Rapina Registrata`,
      `**Civico:** ${civico} | **Tipo:** ${tipo} | **Esito:** ${esito} | **Da:** ${interaction.user.tag}`
    );
  },
};
