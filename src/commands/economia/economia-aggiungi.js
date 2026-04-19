const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedSuccesso, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { logBotLog } = require('../../utils/logger');
const { formatMoney } = require('../../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economia-aggiungi')
    .setDescription('Aggiunge fondi all\'economia della fazione')
    .addNumberOption(o => o.setName('importo').setDescription('Importo da aggiungere').setRequired(true).setMinValue(1))
    .addStringOption(o => o.setName('categoria').setDescription('Categoria dell\'entrata').setRequired(true)
      .addChoices(
        { name: '💰 Fatture', value: 'fatture' },
        { name: '🔫 Rapine', value: 'rapine' },
        { name: '🌾 Campi', value: 'campi' },
        { name: '🏦 Deposito', value: 'deposito' },
        { name: '📦 Altro', value: 'altro' }
      ))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo dell\'entrata').setRequired(true)),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per modificare l\'economia.')], ephemeral: true });
    }

    const importo = interaction.options.getNumber('importo');
    const categoria = interaction.options.getString('categoria');
    const motivo = interaction.options.getString('motivo');

    db.prepare('UPDATE economia SET saldo_totale = saldo_totale + ? WHERE id = 1').run(importo);
    db.prepare('INSERT INTO economia_log (tipo, importo, categoria, motivo, membro_id, data) VALUES (?, ?, ?, ?, ?, ?)')
      .run('entrata', importo, categoria, motivo, interaction.user.id, new Date().toISOString());

    const nuovoSaldo = db.prepare('SELECT saldo_totale FROM economia WHERE id = 1').get().saldo_totale;

    const embed = embedSuccesso(
      '💰 Fondi Aggiunti',
      `**Importo:** +${formatMoney(importo)}\n**Categoria:** ${categoria}\n**Motivo:** ${motivo}\n**Nuovo Saldo:** ${formatMoney(nuovoSaldo)}\n**Registrato da:** ${interaction.member}`
    );

    await interaction.reply({ embeds: [embed] });
    await logBotLog(interaction.client, '💰 Economia +',
      `+${formatMoney(importo)} | ${categoria} | ${motivo} | ${interaction.user.tag}`
    );
  },
};
