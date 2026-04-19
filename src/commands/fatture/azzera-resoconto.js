const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore, embedWarning, embedSuccesso } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { logBotLog } = require('../../utils/logger');
const config = require('../../config/config');

// Mappa temporanea conferme: key -> { target, tipo }
const pendingConfirm = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('azzera-resoconto')
    .setDescription('Azzera il resoconto di un membro')
    .addUserOption(o => o.setName('membro').setDescription('Il membro').setRequired(true))
    .addStringOption(o => o.setName('tipo').setDescription('Cosa azzerare').setRequired(true)
      .addChoices(
        { name: 'Solo settimana corrente', value: 'settimana' },
        { name: 'Storico completo', value: 'completo' }
      )),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi.')], ephemeral: true });
    }

    const target = interaction.options.getMember('membro');
    const tipo = interaction.options.getString('tipo');

    if (!target) {
      return interaction.reply({ embeds: [embedErrore('Membro non trovato.')], ephemeral: true });
    }

    const key = `${interaction.user.id}_${target.id}_${tipo}_${Date.now()}`;
    pendingConfirm.set(key, { target, tipo });
    setTimeout(() => pendingConfirm.delete(key), 30000);

    const tipoLabel = tipo === 'settimana' ? 'settimana corrente' : 'storico completo';
    const embed = embedWarning(
      '⚠️ Conferma Azzeramento',
      `Stai per azzerare il **${tipoLabel}** di ${target}.\n\n**Questa azione non può essere annullata.** Confermi?`
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`azzera_confirm_${key}`).setLabel('Conferma').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`azzera_cancel_${key}`).setLabel('Annulla').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },

  pendingConfirm,

  async handleConfirm(interaction, key) {
    const data = pendingConfirm.get(key);
    if (!data) {
      return interaction.update({ content: '⏱️ Conferma scaduta (30 secondi).', embeds: [], components: [] });
    }

    pendingConfirm.delete(key);
    const { target, tipo } = data;

    if (tipo === 'settimana') {
      db.prepare('UPDATE resoconti SET settimana_corrente_fatturato = 0, settimana_corrente_stipendio = 0 WHERE membro_id = ?')
        .run(target.id);
    } else {
      db.prepare('DELETE FROM resoconti WHERE membro_id = ?').run(target.id);
      db.prepare('DELETE FROM fatture WHERE membro_id = ?').run(target.id);
    }

    db.prepare('INSERT INTO stipendi_log (membro_id, importo, tipo, motivo, staff_id, data) VALUES (?, ?, ?, ?, ?, ?)')
      .run(target.id, 0, 'reset', `Azzeramento ${tipo}`, interaction.user.id, new Date().toISOString());

    await interaction.update({
      embeds: [embedSuccesso('✅ Azzerato', `Resoconto di ${target} azzerato (${tipo}).`)],
      components: [],
    });
    await logBotLog(interaction.client, '🗑️ Resoconto Azzerato',
      `**Membro:** ${target.user.tag} — **Tipo:** ${tipo} — **Staff:** ${interaction.user.tag}`
    );
  },

  async handleCancel(interaction) {
    await interaction.update({
      embeds: [embedBase('❌ Annullato', 'Operazione annullata.', config.colori.errore)],
      components: [],
    });
  },
};
