const cron = require('node-cron');
const db = require('../database/index');
const { embedBase } = require('../utils/embeds');
const { formatMoney } = require('../utils/formatters');
const config = require('../config/config');

async function eseguiPagamenti(client) {
  const resoconti = db.prepare('SELECT * FROM resoconti WHERE settimana_corrente_stipendio > 0').all();

  if (resoconti.length === 0) {
    console.log('[CRON] Nessuno stipendio da pagare questa settimana.');
    return;
  }

  const totale = resoconti.reduce((s, r) => s + r.settimana_corrente_stipendio, 0);

  const righe = resoconti.map((r, i) =>
    `**${i + 1}.** <@${r.membro_id}>\n┣ Stipendio: **${formatMoney(r.settimana_corrente_stipendio)}**\n┗ Fatturato: ${formatMoney(r.settimana_corrente_fatturato)}`
  ).join('\n\n');

  const embed = embedBase('💸 Stipendi Settimanali — Bondes', null, config.colori.primario)
    .addFields(
      { name: '📋 Pagamenti da Effettuare', value: righe, inline: false },
      { name: '👥 Membri da Pagare', value: `${resoconti.length}`, inline: true },
      { name: '💰 Totale da Pagare', value: formatMoney(totale), inline: true }
    );

  try {
    const chId = config.canali.stipendi;
    if (!chId) {
      console.warn('[CRON] Canale stipendi non configurato nel .env');
      return;
    }
    const canale = await client.channels.fetch(chId).catch(() => null);
    if (!canale) {
      console.warn('[CRON] Canale stipendi non trovato su Discord');
      return;
    }
    await canale.send({ embeds: [embed] });
    console.log('[CRON] Embed stipendi settimanali inviato.');
  } catch (err) {
    console.error('[CRON] Errore invio stipendi:', err.message);
  }

  db.prepare('UPDATE resoconti SET settimana_corrente_fatturato = 0, settimana_corrente_stipendio = 0').run();
  console.log('[CRON] Contatori settimanali azzerati.');
}

function avviaStipendioSettimanale(client) {
  cron.schedule('0 9 * * 1', () => eseguiPagamenti(client), {
    timezone: 'Europe/Rome',
  });
  console.log('[CRON] Scheduler stipendi settimanali avviato (ogni lunedì 09:00).');
}

module.exports = { avviaStipendioSettimanale, eseguiPagamenti };
