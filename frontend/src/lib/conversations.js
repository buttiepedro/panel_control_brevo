export function isPendingContact(conversation) {
  return conversation.contactStatus === 'pending_contact' ||
    (conversation.isSilenced === true && conversation.silencedBy === 'bot' &&
      !['contacted', 'resolved'].includes(conversation.contactStatus));
}

export function getConversationStatus(conversation) {
  if (isPendingContact(conversation)) return 'pending';
  if (conversation.contactStatus === 'contacted') return 'contacted';
  return conversation.isSilenced ? 'manual' : 'bot';
}

export function isSameDay(first, second) {
  if (!first || !second) return false;
  const a = new Date(first);
  const b = new Date(second);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isWithinDateRange(value, from, to) {
  if (!from && !to) return true;
  if (!value || (from && to && from > to)) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const day = [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
  return (!from || day >= from) && (!to || day <= to);
}

function getDerivationDates(conversation) {
  const dates = [...(conversation.derivationDates || [])];
  if (conversation.botSilencedAt) dates.push(conversation.botSilencedAt);
  return dates;
}

export function wasDerivedOn(conversation, date) {
  return getDerivationDates(conversation).some((value) => isSameDay(value, date));
}

export function findNewDerivations(previous, current) {
  const known = new Map(previous.map((conversation) => [conversation.phoneNumber, conversation]));
  return current.filter((conversation) => {
    const old = known.get(conversation.phoneNumber);
    const oldDates = new Set(old ? getDerivationDates(old).map((date) => new Date(date).getTime()) : []);
    return getDerivationDates(conversation).some((date) => !oldDates.has(new Date(date).getTime())) ||
      (isPendingContact(conversation) && (!old || !isPendingContact(old)));
  });
}
