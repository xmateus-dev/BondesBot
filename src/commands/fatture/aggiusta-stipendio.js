const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedSuccesso, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { logBotLog } = require('../../utils/logger');
const { formatMoney } = require('../../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aggiusta-stipendio')
    .setDescription('Modifica manualmente lo stipendio accumulato di un membro')
    .addUserOption(o => o.setName('membro').setDescription('Il membro').setRequired(true))
    .addStringOption(o => o.setName('operazione').setDescription('Tipo operazione').setRequired(true)
      .addChoices(
        { name: '➕ Aggiungi', value: 'aggiunta' },
        { name: '➖ Rimuovi', value: 'rimozione' }
      ))
    .addNumberOption(o => o.setName('importo').setDescription('Importo').setRequired(true).setMinValue(1))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo della modifica').setRequired(true)),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi.')], ephemeral: true });
    }

    const target = interaction.options.getMember('membro');
    const operazione = interaction.options.getString('operazione');
    const importo = interaction.options.getNumber('importo');
    const motivo = interaction.options.getString('motivo');

    if (!target) {
      return interaction.reply({ embeds: [embedErrore('Membro non trovato.')], ephemeral: true });
    }

    const delta = operazione === 'aggiunta' ? importo : -importo;

    const esistente = db.prepare('SELECT id FROM resoconti WHERE membro_id = ?').get(target.id);
    if (!esistente) {
      db.prepare('INSERT INTO resoconti (membro_id, stipendio_totale) VALUES (?, ?)').run(target.id, Math.max(0, delta));
    } else {
      db.prepare('UPDATE resoconti SET stipendio_totale = MAX(0, stipendio_totale + ?) WHERE membro_id = ?').run(delta, target.id);
    }

    db.prepare('INSERT INTO stipendi_log (membro_id, importo, tipo, motivo, staff_id, data) VALUES (?, ?, ?, ?, ?, ?)')
      .run(target.id, importo, operazione, motivo, interaction.user.id, new Date().toISOString());

    const simbolo = operazione === 'aggiunta' ? '+' : '-';
    const embed = embedSuccesso(
      `✏️ Stipendio Modificato — ${target.user.username}`,
      `**Membro:** ${target}\n**Operazione:** ${simbolo}${formatMoney(importo)}\n**Motivo:** ${motivo}\n**Staff:** ${interaction.member}`
    );

    await interaction.reply({ embeds: [embed] });
    await logBotLog(interaction.client, '✏️ Stipendio Modificato',
      `**${target.user.tag}** — ${simbolo}${formatMoney(importo)} — ${motivo} — da ${interaction.user.tag}`
    );
  },
};
