const { SlashCommandBuilder } = require('discord.js');
const { embedBase } = require('../../utils/embeds');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Mostra tutti i comandi disponibili'),

  async execute(interaction) {
    const embed = embedBase('📋 Comandi Bondes', null, config.colori.primario)
      .addFields(
        { name: '🎫 Ticket', value: '`/ticketpanel`', inline: false },
        { name: '⚠️ Richiami', value: '`/richiamo` `/richiami-utente` `/rimuovi-richiamo`', inline: false },
        { name: '💰 Fatture & Stipendi', value: '`/fatture` `/resoconto` `/resoconto-settimana`\n`/classifica-fatture` `/aggiusta-stipendio` `/azzera-resoconto`', inline: false },
        { name: '🌾 Campi', value: '`/campi`', inline: true },
        { name: '🔫 Rapine', value: '`/rapine`', inline: true },
        { name: '📁 Schedamenti', value: '`/schedamenti` `/cerca-schedamento` `/lista-schedamenti`', inline: false },
        { name: '🏖️ Assenze', value: '`/assenze` `/lista-assenze` `/chiudi-assenza`', inline: false },
        { name: '💵 Economia', value: '`/economia-aggiungi` `/economia-rimuovi`\n`/economia-saldo` `/economia-storico`', inline: false },
        { name: '🛠️ Utility', value: '`/ping` `/help` `/setup-check`', inline: false }
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
