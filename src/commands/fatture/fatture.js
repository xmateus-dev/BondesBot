const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI, isAlto, isInformativa } = require('../../utils/permissions');
const { logBotLog } = require('../../utils/logger');
const { formatMoney, formatDate } = require('../../utils/formatters');
const config = require('../../config/config');

function aggiornaResoconto(membroId, importo) {
  const stipendio = importo * 0.25;
  const fazione = importo * 0.75;
  const now = new Date().toISOString();

  const esistente = db.prepare('SELECT id FROM resoconti WHERE membro_id = ?').get(membroId);
  if (!esistente) {
    db.prepare(`
      INSERT INTO resoconti
        (membro_id, fatturato_totale, stipendio_totale, quota_fazione_totale,
         fatture_count, settimana_corrente_fatturato, settimana_corrente_stipendio,
         ultimo_importo, ultima_data)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(membroId, importo, stipendio, fazione, importo, stipendio, importo, now);
  } else {
    db.prepare(`
      UPDATE resoconti SET
        fatturato_totale = fatturato_totale + ?,
        stipendio_totale = stipendio_totale + ?,
        quota_fazione_totale = quota_fazione_totale + ?,
        fatture_count = fatture_count + 1,
        settimana_corrente_fatturato = settimana_corrente_fatturato + ?,
        settimana_corrente_stipendio = settimana_corrente_stipendio + ?,
        ultimo_importo = ?,
        ultima_data = ?
      WHERE membro_id = ?
    `).run(importo, stipendio, fazione, importo, stipendio, importo, now, membroId);
  }

  db.prepare('UPDATE economia SET saldo_totale = saldo_totale + ? WHERE id = 1').run(fazione);

  db.prepare('INSERT INTO stipendi_log (membro_id, importo, tipo, motivo, staff_id, data) VALUES (?, ?, ?, ?, ?, ?)')
    .run(membroId, stipendio, 'aggiunta', 'Fattura emessa', membroId, now);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fatture')
    .setDescription('Registra una nuova fattura')
    .addStringOption(o => o.setName('cliente').setDescription('Nome e cognome del cliente').setRequired(true))
    .addStringOption(o => o.setName('tipo').setDescription('Tipo di fattura').setRequired(true))
    .addNumberOption(o => o.setName('importo').setDescription('Importo in $').setRequired(true).setMinValue(1))
    .addStringOption(o => o.setName('note').setDescription('Note facoltative').setRequired(false)),

  async execute(interaction) {
    const autorizzato =
      checkPermission(interaction.member, LIVELLI.RECLUTA) ||
      isInformativa(interaction.member) ||
      isAlto(interaction.member);

    if (!autorizzato) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per emettere fatture.')], ephemeral: true });
    }

    const cliente = interaction.options.getString('cliente');
    const tipo = interaction.options.getString('tipo');
    const importo = interaction.options.getNumber('importo');
    const note = interaction.options.getString('note') || null;
    const membroId = interaction.user.id;
    const data = new Date().toISOString();

    const result = db.prepare('INSERT INTO fatture (cliente_nome, tipo, importo, membro_id, note, data) VALUES (?, ?, ?, ?, ?, ?)')
      .run(cliente, tipo, importo, membroId, note, data);
    const fatturaId = result.lastInsertRowid;

    aggiornaResoconto(membroId, importo);

    const stipendio = importo * 0.25;
    const fazione = importo * 0.75;

    const embed = embedBase(`💰 Fattura #${fatturaId}`, null, config.colori.primario)
      .addFields(
        { name: 'Cliente', value: cliente, inline: true },
        { name: 'Tipo', value: tipo, inline: true },
        { name: 'Emessa da', value: `${interaction.member}`, inline: true },
        { name: 'Importo Totale', value: formatMoney(importo), inline: true },
        { name: 'Quota Personale (25%)', value: formatMoney(stipendio), inline: true },
        { name: 'Quota Fazione (75%)', value: formatMoney(fazione), inline: true },
        { name: 'Note', value: note || 'Nessuna', inline: false },
        { name: 'Data', value: formatDate(data), inline: false }
      );

    if (config.canali.fatture) {
      const canale = await interaction.client.channels.fetch(config.canali.fatture).catch(() => null);
      if (canale) await canale.send({ embeds: [embed] });
    }
    await interaction.reply({ content: `💰 Fattura #${fatturaId} registrata con successo!`, ephemeral: true });
    await logBotLog(interaction.client, '💰 Fattura Registrata',
      `**#${fatturaId}** — ${interaction.user.tag} — ${formatMoney(importo)} — Cliente: ${cliente}`
    );
  },
};
