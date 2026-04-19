const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore, embedWarning, embedSuccesso } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { logBotLog } = require('../../utils/logger');
const { formatDate } = require('../../utils/formatters');
const config = require('../../config/config');

const pendingConfirm = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('azzera-schedamenti')
    .setDescription('Azzera l\'intero archivio degli schedamenti [ALTO]'),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({
        embeds: [embedErrore('Non hai i permessi per usare questo comando.')],
        ephemeral: true,
      });
    }

    const { count } = db.prepare('SELECT COUNT(*) as count FROM schedamenti').get();

    const key = `${interaction.user.id}_${Date.now()}`;
    pendingConfirm.set(key, { count });
    setTimeout(() => pendingConfirm.delete(key), 30000);

    const embed = embedWarning(
      '⚠️  Conferma Azzeramento Archivio',
      `Stai per **eliminare permanentemente l\'intero archivio degli schedamenti**.\n\n` +
      `📁 **Schedamenti presenti:** ${count}\n\n` +
      `⛔ **Questa azione è irreversibile.** Tutti i dati verranno persi definitivamente.\n\n` +
      `Sei sicuro di voler procedere?`
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`azzera_sched_confirm_${key}`)
        .setLabel('Conferma')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`azzera_sched_cancel_${key}`)
        .setLabel('Annulla')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },

  pendingConfirm,

  async handleConfirm(interaction, key) {
    const data = pendingConfirm.get(key);
    if (!data) {
      return interaction.update({
        content: '⏱️ Conferma scaduta (30 secondi). Riesegui il comando.',
        embeds: [],
        components: [],
      });
    }

    pendingConfirm.delete(key);

    const result = db.prepare('DELETE FROM schedamenti').run();
    const eliminati = result.changes;
    const ora = new Date().toISOString();

    await interaction.update({
      embeds: [
        embedSuccesso(
          '✅ Archivio Azzerato',
          `L\'archivio degli schedamenti è stato completamente ripulito.\n\n` +
          `🗑️ **Record eliminati:** ${eliminati}\n` +
          `👤 **Eseguito da:** ${interaction.user}\n` +
          `🕐 **Data:** ${formatDate(ora)}`
        ),
      ],
      components: [],
    });

    await logBotLog(
      interaction.client,
      '🗑️ Archivio Schedamenti Azzerato',
      `**Eseguito da:** ${interaction.user.tag}\n` +
      `**Record eliminati:** ${eliminati}\n` +
      `**Data:** ${formatDate(ora)}`
    );
  },

  async handleCancel(interaction) {
    await interaction.update({
      embeds: [
        embedBase(
          '❌ Operazione Annullata',
          `L\'archivio degli schedamenti non è stato modificato.`,
          config.colori.errore
        ),
      ],
      components: [],
    });
  },
};
