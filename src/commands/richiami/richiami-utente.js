const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { formatDate } = require('../../utils/formatters');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('richiami-utente')
    .setDescription('Visualizza lo storico richiami di un membro')
    .addUserOption(o => o.setName('membro').setDescription('Il membro da controllare').setRequired(true)),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per visualizzare i richiami.')], ephemeral: true });
    }

    const target = interaction.options.getMember('membro');
    if (!target) {
      return interaction.reply({ embeds: [embedErrore('Membro non trovato.')], ephemeral: true });
    }

    const richiami = db.prepare('SELECT * FROM richiami WHERE utente_id = ? ORDER BY data DESC').all(target.id);

    if (richiami.length === 0) {
      return interaction.reply({
        embeds: [embedBase('📋 Storico Richiami', `${target} non ha richiami registrati.`, config.colori.successo)],
        ephemeral: true,
      });
    }

    const righe = richiami.map((r, i) =>
      `**Richiamo #${richiami.length - i}** — <@${r.staff_id}> • ${formatDate(r.data)}\n📝 ${r.motivo}${r.note ? `\n🗒️ *${r.note}*` : ''}`
    ).join('\n\n');

    const embed = embedBase(`📋 Storico Richiami — ${target.user.username}`, righe, config.colori.warning)
      .addFields({ name: 'Totale Richiami Attivi', value: `${richiami.length}/3`, inline: true });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
