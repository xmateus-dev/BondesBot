const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lista-assenze')
    .setDescription('Mostra tutte le assenze attive'),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per visualizzare le assenze.')], ephemeral: true });
    }

    const assenze = db.prepare('SELECT * FROM assenze WHERE stato = ? ORDER BY id DESC').all('aperta');

    if (assenze.length === 0) {
      return interaction.reply({
        embeds: [embedBase('📋 Assenze', 'Nessuna assenza attiva al momento.', config.colori.info)],
        ephemeral: true,
      });
    }

    const righe = assenze.map(a =>
      `**#${a.id}** — <@${a.membro_id}>\n┣ Dal **${a.dal_giorno}** al **${a.al_giorno}**\n┗ 📝 ${a.motivo}`
    ).join('\n\n');

    const embed = embedBase(`📋 Assenze Attive — ${assenze.length} totali`, righe, config.colori.warning);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
