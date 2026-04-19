const { SlashCommandBuilder } = require('discord.js');
const { embedBase, embedErrore } = require('../../utils/embeds');
const { checkPermission, LIVELLI } = require('../../utils/permissions');
const config = require('../../config/config');
const db = require('../../database/index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-check')
    .setDescription('Controlla la configurazione del bot'),

  async execute(interaction) {
    if (!checkPermission(interaction.member, LIVELLI.ALTO)) {
      return interaction.reply({ embeds: [embedErrore('Non hai i permessi per usare questo comando.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const lines = [];

    for (const [key, id] of Object.entries(config.canali)) {
      if (!id) {
        lines.push(`❌ Canale \`${key}\` — non configurato nel .env`);
        continue;
      }
      const ch = await interaction.client.channels.fetch(id).catch(() => null);
      lines.push(ch
        ? `✅ Canale \`${key}\` — #${ch.name}`
        : `⚠️ Canale \`${key}\` — ID non trovato (${id})`
      );
    }

    const guild = interaction.guild;
    for (const [key, id] of Object.entries(config.ruoli)) {
      if (!id) {
        lines.push(`❌ Ruolo \`${key}\` — non configurato nel .env`);
        continue;
      }
      const role = guild.roles.cache.get(id);
      lines.push(role
        ? `✅ Ruolo \`${key}\` — @${role.name}`
        : `⚠️ Ruolo \`${key}\` — ID non trovato (${id})`
      );
    }

    try {
      db.prepare('SELECT 1').get();
      lines.push('✅ Database — connesso correttamente');
    } catch {
      lines.push('❌ Database — errore di connessione');
    }

    const botMember = guild.members.me;
    const permsOk = botMember.permissions.has(['ManageChannels', 'ManageRoles', 'SendMessages', 'ViewChannel']);
    lines.push(permsOk
      ? '✅ Permessi bot — sufficienti'
      : '⚠️ Permessi bot — potrebbero mancare ManageChannels / ManageRoles'
    );

    const embed = embedBase('🔧 Setup Check — Bondes Bot', lines.join('\n'), config.colori.info);
    await interaction.editReply({ embeds: [embed] });
  },
};
