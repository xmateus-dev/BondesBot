const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/index');
const { embedSuccesso, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const { logCanale, logBotLog } = require('../../utils/logger');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rimuovi-richiamo')
    .setDescription('Rimuove l\'ultimo richiamo di un membro')
    .addUserOption(o => o.setName('membro').setDescription('Il membro').setRequired(true))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo della rimozione').setRequired(true)),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per rimuovere richiami.')], ephemeral: true });
    }

    const target = interaction.options.getMember('membro');
    const motivo = interaction.options.getString('motivo');

    if (!target) {
      return interaction.reply({ embeds: [embedErrore('Membro non trovato.')], ephemeral: true });
    }

    const ultimo = db.prepare('SELECT * FROM richiami WHERE utente_id = ? ORDER BY id DESC LIMIT 1').get(target.id);
    if (!ultimo) {
      return interaction.reply({ embeds: [embedErrore(`${target} non ha richiami da rimuovere.`)], ephemeral: true });
    }

    db.prepare('DELETE FROM richiami WHERE id = ?').run(ultimo.id);

    const ruoliRichiamo = [config.ruoli.richiamo1, config.ruoli.richiamo2, config.ruoli.richiamo3];
    try {
      for (const rid of ruoliRichiamo) {
        if (rid && target.roles.cache.has(rid)) await target.roles.remove(rid);
      }
      const rimanenti = db.prepare('SELECT COUNT(*) as c FROM richiami WHERE utente_id = ?').get(target.id).c;
      if (rimanenti > 0) {
        const ruoloDaAssegnare = ruoliRichiamo[rimanenti - 1];
        if (ruoloDaAssegnare) await target.roles.add(ruoloDaAssegnare);
      }
    } catch (err) {
      console.warn('[RIMUOVI-RICHIAMO] Errore aggiornamento ruoli:', err.message);
    }

    const embed = embedSuccesso(
      `✅ Richiamo Rimosso — ${target.user.username}`,
      `**Membro:** ${target}\n**Rimosso da:** ${interaction.member}\n**Motivo:** ${motivo}`
    );

    await interaction.reply({ embeds: [embed] });

    await logCanale(interaction.client, 'richiamiLog',
      '✅ Richiamo Rimosso',
      `**Membro:** ${target.user.tag}\n**Staff:** ${interaction.user.tag}\n**Motivo:** ${motivo}`,
      config.colori.successo
    );
    await logBotLog(interaction.client, '✅ Richiamo Rimosso',
      `**${target.user.tag}** — da ${interaction.user.tag} — Motivo: ${motivo}`
    );
  },
};
