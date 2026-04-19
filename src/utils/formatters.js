function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatMoney(amount) {
  return `$${Number(amount).toLocaleString('it-IT')}`;
}

function formatMembers(membersString) {
  if (!membersString) return 'N/D';
  return membersString.split(',').map(m => m.trim()).join(', ');
}

function padNumber(n, length = 3) {
  return String(n).padStart(length, '0');
}

module.exports = { formatDate, formatMoney, formatMembers, padNumber };
