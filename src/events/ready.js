module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`[BOT] ${client.user.tag} è online e pronto.`);
    client.user.setActivity('Bondes — Sistema Interno', { type: 4 });
  },
};
