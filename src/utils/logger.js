const { embedBase } = require('./embeds');
const config = require('../config/config');

async function logCanale(client, canaleName, titolo, descrizione, colore) {
  try {
    const canalId = config.canali[canaleName];
    if (!canalId) return;
    const canale = await client.channels.fetch(canalId).catch(() => null);
    if (!canale) return;
    const embed = embedBase(titolo, descrizione, colore || config.colori.primario);
    await canale.send({ embeds: [embed] });
  } catch (err) {
    console.warn(`[LOG] Impossibile loggare su "${canaleName}":`, err.message);
  }
}

async function logBotLog(client, titolo, descrizione) {
  await logCanale(client, 'botLog', titolo, descrizione);
}

module.exports = { logCanale, logBotLog };
