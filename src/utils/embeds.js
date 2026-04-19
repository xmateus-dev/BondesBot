const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

function embedBase(titolo, descrizione, colore) {
  return new EmbedBuilder()
    .setTitle(titolo)
    .setDescription(descrizione || null)
    .setColor(colore || config.colori.primario)
    .setFooter({ text: `${config.fazione} — Sistema Interno` })
    .setTimestamp();
}

function embedSuccesso(titolo, descrizione) {
  return embedBase(titolo, descrizione, config.colori.successo);
}

function embedErrore(descrizione) {
  return embedBase('⛔ Accesso Negato', descrizione, config.colori.errore);
}

function embedWarning(titolo, descrizione) {
  return embedBase(titolo, descrizione, config.colori.warning);
}

function embedInfo(titolo, descrizione) {
  return embedBase(titolo, descrizione, config.colori.info);
}

module.exports = { embedBase, embedSuccesso, embedErrore, embedWarning, embedInfo };
