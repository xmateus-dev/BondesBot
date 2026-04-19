const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assenze')
    .setDescription('Registra un\'assenza')
    .addStringOption(o => o.setName('motivo').setDescription('Motivo dell\'assenza').setRequired(true))
    .addStringOption(o => o.setName('dal').setDescription('Data inizio (es. 20/04/2026)').setRequired(true))
    .addStringOption(o => o.setName('al').setDescription('Data fine (es. 25/04/2026)').setRequired(true)),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.MEMBRO)) {
      return interaction.reply({ embeds: [embedErrore('Devi essere un membro della fazione per registrare un\'assenza.')], ephemeral: true });
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

    await interaction.reply({ embeds: [embed] });
  },
};
