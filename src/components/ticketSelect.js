const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/index');
const config = require('../config/config');
const { embedBase, embedErrore } = require('../utils/embeds');
const { padNumber } = require('../utils/formatters');
const { logBotLog, logCanale } = require('../utils/logger');

module.exports = {
  ids: ['ticket_select'],

  async execute(interaction) {
    const tipo = interaction.values[0];
    const guild = interaction.guild;
    const member = interaction.member;

    const esistente = db.prepare(
      'SELECT canale_id FROM tickets WHERE utente_id = ? AND tipo = ? AND stato = ?'
    ).get(member.id, tipo, 'aperto');

    if (esistente) {
      const chExist = guild.channels.cache.get(esistente.canale_id);
      const msg = chExist
        ? `Hai già un ticket **${tipo}** aperto: ${chExist}`
        : `Hai già un ticket **${tipo}** aperto. Chiudilo prima di aprirne un altro.`;
      return interaction.reply({ embeds: [embedErrore(msg)], ephemeral: true });
    }

    const row = db.prepare('SELECT MAX(numero_progressivo) as max FROM tickets WHERE tipo = ?').get(tipo);
    const numero = (row?.max || 0) + 1;
    const nomeCanale = `${tipo}-${padNumber(numero)}`;

    const ruoliAccesso = [config.ruoli.boss, config.ruoli.viceBoss, config.ruoli.staff];
    if (tipo === 'informativa') {
      ruoliAccesso.push(config.ruoli.informativa, config.ruoli.gInformativa);
    } else {
      ruoliAccesso.push(config.ruoli.braccioArmato, config.ruoli.gBraccio);
    }

    const permissionOverwrites = [
      { id: guild.id, deny: ['ViewChannel'] },
      { id: member.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
    ];
    for (const roleId of ruoliAccesso) {
      if (roleId) {
        permissionOverwrites.push({ id: roleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
      }
    }

    const categoria = guild.channels.cache.find(c => c.name === '📋 Ticket' && c.type === 4) || null;

    await interaction.deferReply({ ephemeral: true });

    const canaleTicket = await guild.channels.create({
      name: nomeCanale,
      type: 0,
      parent: categoria?.id,
      permissionOverwrites,
    });

    const dataApertura = new Date().toISOString();
    const insert = db.prepare(
      'INSERT INTO tickets (tipo, canale_id, utente_id, stato, data_apertura, numero_progressivo) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = insert.run(tipo, canaleTicket.id, member.id, 'aperto', dataApertura, numero);
    const ticketId = result.lastInsertRowid;

    const tipoLabel = tipo === 'informativa' ? '📂 Informativa' : '🔫 Braccio Armato';
    const embedApertura = embedBase(`${tipoLabel} — Ticket #${padNumber(numero)}`, null, config.colori.primario)
      .addFields(
        { name: 'Utente', value: `${member}`, inline: true },
        { name: 'Tipo', value: tipoLabel, inline: true },
        { name: 'ID Ticket', value: `#${ticketId}`, inline: true },
        { name: 'Apertura', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
        { name: 'Istruzioni', value: 'Descrivi la tua richiesta. Lo staff ti risponderà al più presto.', inline: false }
      );

    const rowBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_chiudi_${canaleTicket.id}`)
        .setLabel('Chiudi Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    await canaleTicket.send({ content: `${member}`, embeds: [embedApertura], components: [rowBtn] });
    await interaction.editReply({ content: `✅ Ticket aperto: ${canaleTicket}` });

    await logCanale(interaction.client, 'ticketLog',
      '🎫 Ticket Aperto',
      `**Utente:** ${member.user.tag}\n**Tipo:** ${tipo}\n**Canale:** ${canaleTicket.name}\n**ID:** #${ticketId}`,
      config.colori.info
    );
    await logBotLog(interaction.client, '🎫 Ticket Aperto',
      `**Utente:** ${member.user.tag} | **Tipo:** ${tipo} | **ID:** #${ticketId}`
    );
  },
};
