const db = require('../database/index');
const { embedBase, embedErrore, embedSuccesso } = require('../utils/embeds');
const { logCanale, logBotLog } = require('../utils/logger');
const { formatDate } = require('../utils/formatters');
const config = require('../config/config');

module.exports = {
  ids: ['ticket_chiudi_'],

  async execute(interaction) {
    if (!interaction.customId.startsWith('ticket_chiudi_')) return;

    const canaleId = interaction.customId.replace('ticket_chiudi_', '');
    const ticket = db.prepare('SELECT * FROM tickets WHERE canale_id = ? AND stato = ?').get(canaleId, 'aperto');

    if (!ticket) {
      return interaction.reply({ embeds: [embedErrore('Ticket non trovato o già chiuso.')], ephemeral: true });
    }

    const member = interaction.member;
    const isCreatore = member.id === ticket.utente_id;
    const isAlto = [config.ruoli.boss, config.ruoli.viceBoss, config.ruoli.staff]
      .some(r => r && member.roles.cache.has(r));

    if (!isCreatore && !isAlto) {
      return interaction.reply({
        embeds: [embedErrore('Solo il creatore del ticket o lo staff possono chiuderlo.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const dataChiusura = new Date().toISOString();
    db.prepare('UPDATE tickets SET stato = ?, data_chiusura = ? WHERE canale_id = ?')
      .run('chiuso', dataChiusura, canaleId);

    let countMsg = 0;
    try {
      const msgs = await interaction.channel.messages.fetch({ limit: 100 });
      countMsg = msgs.size;
    } catch {}

    const durataMs = Date.now() - new Date(ticket.data_apertura).getTime();
    const durataMin = Math.floor(durataMs / 60000);

    const embed = embedBase('🔒 Ticket Chiuso', null, config.colori.errore)
      .addFields(
        { name: 'ID Ticket', value: `#${ticket.id}`, inline: true },
        { name: 'Tipo', value: ticket.tipo, inline: true },
        { name: 'Chiuso da', value: `${member}`, inline: true },
        { name: 'Apertura', value: formatDate(ticket.data_apertura), inline: true },
        { name: 'Chiusura', value: formatDate(dataChiusura), inline: true },
        { name: 'Durata', value: `${durataMin} minuti`, inline: true },
        { name: 'Messaggi stimati', value: `${countMsg}`, inline: true }
      );

    await interaction.editReply({ embeds: [embed] });

    await logCanale(interaction.client, 'ticketLog',
      '🔒 Ticket Chiuso',
      `**ID:** #${ticket.id}\n**Tipo:** ${ticket.tipo}\n**Utente:** <@${ticket.utente_id}>\n**Chiuso da:** ${member.user.tag}\n**Durata:** ${durataMin} min`,
      config.colori.warning
    );

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);
  },
};
