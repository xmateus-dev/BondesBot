const config = require('../config/config');

const LIVELLI = {
  TUTTI: 0,
  MEMBRO: 1,
  RECLUTA: '2A',
  INFORMATIVA: '2B',
  BRACCIO: '2C',
  ALTO: 3,
};

function hasRole(member, roleId) {
  if (!roleId) return false;
  return member.roles.cache.has(roleId);
}

function isAlto(member) {
  return (
    hasRole(member, config.ruoli.boss) ||
    hasRole(member, config.ruoli.viceBoss) ||
    hasRole(member, config.ruoli.staff)
  );
}

function isMembro(member) {
  const ruoliFazione = [
    config.ruoli.boss, config.ruoli.viceBoss, config.ruoli.staff,
    config.ruoli.braccioArmato, config.ruoli.gBraccio,
    config.ruoli.informativa, config.ruoli.gInformativa,
    config.ruoli.recluta,
  ];
  return ruoliFazione.some(r => r && member.roles.cache.has(r));
}

function isRecluta(member) {
  return hasRole(member, config.ruoli.recluta) || isAlto(member);
}

function isInformativa(member) {
  return (
    hasRole(member, config.ruoli.informativa) ||
    hasRole(member, config.ruoli.gInformativa) ||
    isAlto(member)
  );
}

function isBraccio(member) {
  return (
    hasRole(member, config.ruoli.braccioArmato) ||
    hasRole(member, config.ruoli.gBraccio) ||
    isAlto(member)
  );
}

function checkPermission(member, livello) {
  if (livello === LIVELLI.TUTTI) return true;
  if (livello === LIVELLI.MEMBRO) return isMembro(member);
  if (livello === LIVELLI.RECLUTA) return isRecluta(member);
  if (livello === LIVELLI.INFORMATIVA) return isInformativa(member);
  if (livello === LIVELLI.BRACCIO) return isBraccio(member);
  if (livello === LIVELLI.ALTO) return isAlto(member);
  return false;
}

module.exports = { checkPermission, LIVELLI, isAlto, isMembro, isInformativa, isBraccio };
