const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { logCanale, logBotLog } = require('../../utils/logger');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('richiamo')
    .setDescription('Assegna un richiamo a un membro della fazione')
    .addUserOption(o => o.setName('membro').setDescription('Il membro da richiamare').setRequired(true))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo del richiamo').setRequired(true))
    .addStringOption(o => o.setName('note').setDescription('Note aggiuntive (facoltativo)').setRequired(false)),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per assegnare richiami.')], ephemeral: true });
    }

    const target = interaction.options.getMember('membro');
    const motivo = interaction.options.getString('motivo');
    const note = interaction.options.getString('note') || null;

    if (!target) {
      return interaction.reply({ embeds: [embedErrore('Membro non trovato nel server.')], ephemeral: true });
    }

    const totale = db.prepare('SELECT COUNT(*) as c FROM richiami WHERE utente_id = ?').get(target.id).c;
    const nuovoNumero = totale + 1;

    if (nuovoNumero > 3) {
      return interaction.reply({
        embeds: [embedErrore(`${target} ha già 3 richiami attivi. Rimuovine uno prima di aggiungerne un altro.`)],
        ephemeral: true,
      });
    }

    db.prepare('INSERT INTO richiami (utente_id, staff_id, numero, motivo, note, data) VALUES (?, ?, ?, ?, ?, ?)')
      .run(target.id, interaction.user.id, nuovoNumero, motivo, note, new Date().toISOString());

    const ruoliRichiamo = [config.ruoli.richiamo1, config.ruoli.richiamo2, config.ruoli.richiamo3];
    try {
      for (const rid of ruoliRichiamo) {
        if (rid && target.roles.cache.has(rid)) await target.roles.remove(rid);
      }
      const nuovoRuolo = ruoliRichiamo[nuovoNumero - 1];
      if (nuovoRuolo) await target.roles.add(nuovoRuolo);
    } catch (err) {
      console.warn('[RICHIAMO] Errore gestione ruoli:', err.message);
    }

    const embed = embedBase(`⚠️ Richiamo #${nuovoNumero} — ${target.user.username}`, null, config.colori.warning)
      .addFields(
        { name: 'Membro', value: `${target}`, inline: true },
        { name: 'Richiamo N°', value: `${nuovoNumero}/3`, inline: true },
        { name: 'Assegnato da', value: `${interaction.member}`, inline: true },
        { name: 'Motivo', value: motivo, inline: false },
        { name: 'Note', value: note || 'Nessuna', inline: false }
      );

    await interaction.reply({ embeds: [embed] });

    await logCanale(interaction.client, 'richiamiLog',
      '⚠️ Richiamo Assegnato',
      `**Membro:** ${target.user.tag}\n**Richiamo:** #${nuovoNumero}/3\n**Staff:** ${interaction.user.tag}\n**Motivo:** ${motivo}`,
      config.colori.warning
    );
    await logBotLog(interaction.client, '⚠️ Richiamo',
      `**${target.user.tag}** — #${nuovoNumero}/3 — ${motivo} — da ${interaction.user.tag}`
    );
  },
};
