const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedSuccesso, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { logBotLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chiudi-assenza')
    .setDescription('Chiude un\'assenza tramite ID')
    .addIntegerOption(o => o.setName('id').setDescription('ID dell\'assenza da chiudere').setRequired(true)),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per chiudere assenze.')], ephemeral: true });
    }

    const id = interaction.options.getInteger('id');
    const assenza = db.prepare('SELECT * FROM assenze WHERE id = ? AND stato = ?').get(id, 'aperta');

    if (!assenza) {
      return interaction.reply({
        embeds: [embedErrore(`Assenza #${id} non trovata o già chiusa.`)],
        ephemeral: true,
      });
    }

    db.prepare('UPDATE assenze SET stato = ?, data_chiusura = ? WHERE id = ?')
      .run('chiusa', new Date().toISOString(), id);

    const embed = embedSuccesso(
      '✅ Assenza Chiusa',
      `**ID:** #${id}\n**Membro:** <@${assenza.membro_id}>\n**Dal:** ${assenza.dal_giorno} al ${assenza.al_giorno}\n**Chiusa da:** ${interaction.member}`
    );

    await interaction.reply({ embeds: [embed] });
    await logBotLog(interaction.client, '✅ Assenza Chiusa',
      `**ID:** #${id} | **Membro:** <@${assenza.membro_id}> | **Staff:** ${interaction.user.tag}`
    );
  },
};
