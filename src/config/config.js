require('dotenv').config();

const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[CONFIG] Variabile obbligatoria mancante: ${key}`);
    process.exit(1);
  }
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  canali: {
    ticket: process.env.CH_TICKET,
    ticketLog: process.env.CH_TICKET_LOG,
    richiamiLog: process.env.CH_RICHIAMI_LOG,
    fatture: process.env.CH_FATTURE,
    esitoCampi: process.env.CH_ESITO_CAMPI,
    esitoRapine: process.env.CH_ESITO_RAPINE,
    schedamenti: process.env.CH_SCHEDAMENTI,
    assenze: process.env.CH_ASSENZE,
    economia: process.env.CH_ECONOMIA,
    botLog: process.env.CH_BOT_LOG,
    stipendi: process.env.CH_STIPENDI,
  },

  ruoli: {
    boss: process.env.ROLE_BOSS,
    viceBoss: process.env.ROLE_VICE_BOSS,
    staff: process.env.ROLE_STAFF,
    braccioArmato: process.env.ROLE_BRACCIO_ARMATO,
    gBraccio: process.env.ROLE_G_BRACCIO,
    informativa: process.env.ROLE_INFORMATIVA,
    gInformativa: process.env.ROLE_G_INFORMATIVA,
    recluta: process.env.ROLE_RECLUTA,
    richiamo1: process.env.ROLE_RICHIAMO_1,
    richiamo2: process.env.ROLE_RICHIAMO_2,
    richiamo3: process.env.ROLE_RICHIAMO_3,
  },

  colori: {
    primario: 0x1a1a2e,
    successo: 0x16213e,
    errore: 0xc0392b,
    warning: 0xe67e22,
    info: 0x0f3460,
  },

  fazione: 'Bondes',
};
