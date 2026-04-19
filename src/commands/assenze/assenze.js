const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { logBotLog } = require('../../utils/logger');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assenze')
    .setDescription('Registra un\'assenza')
    .addStringOption(o => o.setName('motivo').setDescription('Motivo dell\'assenza').setRequired(true))
    .addStringOption(o => o.setName('dal').setDescription('Data inizio (es. 20/04/2026)').setRequired(true))
    .addStringOption(o => o.setName('al').setDescription('Data fine (es. 25/04/2026)').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!checkPermission(interaction.member, LIVELLI.MEMBRO)) {
      return interaction.editReply({ embeds: [embedErrore('Devi essere un membro della fazione per registrare un\'assenza.')] });
    }

    const motivo = interaction.options.getString('motivo');
    const dal = interaction.options.getString('dal');
    const al = interaction.options.getString('al');

    db.prepare('INSERT INTO assenze (membro_id, staff_id, motivo, dal_giorno, al_giorno, stato) VALUES (?, ?, ?, ?, ?, ?)')
      .run(interaction.user.id, interaction.user.id, motivo, dal, al, 'aperta');

    const embed = embedBase('🏖️ Assenza Registrata', null, config.colori.warning)
      .addFields(
        { name: 'Membro', value: `${interaction.member}`, inline: true },
        { name: 'Dal', value: dal, inline: true },
        { name: 'Al', value: al, inline: true },
        { name: 'Motivo', value: motivo, inline: false }
      );

    if (config.canali.assenze) {
      const canale = await interaction.client.channels.fetch(config.canali.assenze).catch(() => null);
      if (canale) await canale.send({ embeds: [embed] });
    }

    await interaction.deleteReply();

    if (config.canali.botLog !== config.canali.assenze) {
      await logBotLog(interaction.client, '🏖️ Assenza Registrata',
        `**Membro:** ${interaction.user.tag} | **Dal:** ${dal} | **Al:** ${al}`
      );
    }
  },
};
