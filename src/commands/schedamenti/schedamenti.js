const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { isInformativa } = require('../../utils/permissions');
const { logBotLog } = require('../../utils/logger');
const { formatDate } = require('../../utils/formatters');
const config = require('../../config/config');

const STATO_EMOJI = { attenzionato: '👁️', affidabile: '✅', sospetto: '⚠️', ostile: '🔴' };
const STATO_COLORE = {
  attenzionato: config.colori.warning,
  affidabile: config.colori.successo,
  sospetto: config.colori.warning,
  ostile: config.colori.errore,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedamenti')
    .setDescription('Registra una nuova scheda personale nell\'archivio')
    .addStringOption(o => o.setName('nome').setDescription('Nome').setRequired(true))
    .addStringOption(o => o.setName('cognome').setDescription('Cognome').setRequired(true))
    .addStringOption(o => o.setName('eta').setDescription('Età').setRequired(true))
    .addStringOption(o => o.setName('provenienza').setDescription('Provenienza').setRequired(true))
    .addStringOption(o => o.setName('ruolo').setDescription('Ruolo o affiliazione').setRequired(true))
    .addStringOption(o => o.setName('pericolosita').setDescription('Livello di pericolosità').setRequired(true))
    .addStringOption(o => o.setName('stato').setDescription('Classificazione soggetto').setRequired(true)
      .addChoices(
        { name: '👁️ Attenzionato', value: 'attenzionato' },
        { name: '✅ Affidabile', value: 'affidabile' },
        { name: '⚠️ Sospetto', value: 'sospetto' },
        { name: '🔴 Ostile', value: 'ostile' }
      ))
    .addStringOption(o => o.setName('veicolo').setDescription('Veicolo (facoltativo)').setRequired(false))
    .addStringOption(o => o.setName('note').setDescription('Note aggiuntive (facoltativo)').setRequired(false)),

  async execute(interaction) {
    if (!isInformativa(interaction.member)) {
      return interaction.reply({ embeds: [embedErrore('Solo l\'Informativa può gestire gli schedamenti.')], ephemeral: true });
    }

    const nome = interaction.options.getString('nome');
    const cognome = interaction.options.getString('cognome');
    const eta = interaction.options.getString('eta');
    const provenienza = interaction.options.getString('provenienza');
    const ruolo = interaction.options.getString('ruolo');
    const pericolosita = interaction.options.getString('pericolosita');
    const stato = interaction.options.getString('stato');
    const veicolo = interaction.options.getString('veicolo') || null;
    const note = interaction.options.getString('note') || null;
    const data = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO schedamenti (nome, cognome, eta, provenienza, ruolo, pericolosita, veicolo, stato, note, autore_id, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nome, cognome, eta, provenienza, ruolo, pericolosita, veicolo, stato, note, interaction.user.id, data);

    const emoji = STATO_EMOJI[stato] || '❓';
    const colore = STATO_COLORE[stato] || config.colori.primario;

    const embed = embedBase(`📁 Schedamento #${result.lastInsertRowid} — ${nome} ${cognome}`, null, colore)
      .addFields(
        { name: '👤 Identità', value: `**${nome} ${cognome}**, ${eta} anni`, inline: true },
        { name: '🌍 Provenienza', value: provenienza, inline: true },
        { name: '🎭 Ruolo/Affiliazione', value: ruolo, inline: true },
        { name: '⚠️ Pericolosità', value: pericolosita, inline: true },
        { name: '🚗 Veicolo', value: veicolo || 'N/D', inline: true },
        { name: `${emoji} Stato`, value: stato.charAt(0).toUpperCase() + stato.slice(1), inline: true },
        { name: '📝 Note', value: note || 'Nessuna', inline: false },
        { name: '🕐 Data', value: formatDate(data), inline: true },
        { name: '👤 Schedato da', value: `${interaction.member}`, inline: true }
      );

    const chSched = config.canali.schedamenti;
    if (chSched) {
      const canale = await interaction.client.channels.fetch(chSched).catch(() => null);
      if (canale) await canale.send({ embeds: [embed] });
    }

    await interaction.reply({ embeds: [embed] });
    await logBotLog(interaction.client, '📁 Nuovo Schedamento',
      `**${nome} ${cognome}** — Stato: ${stato} — Da: ${interaction.user.tag}`
    );
  },
};
