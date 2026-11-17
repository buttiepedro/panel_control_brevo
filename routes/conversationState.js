function applyConversationState(conversation, payload, now = new Date()) {
  const wasPending =
    conversation.contactStatus === 'pending_contact' ||
    (conversation.isSilenced && conversation.silencedBy === 'bot' &&
      !['contacted', 'resolved'].includes(conversation.contactStatus));

  const dates = conversation.derivationDates || [];
  if (conversation.botSilencedAt &&
      !dates.some((date) => new Date(date).getTime() === new Date(conversation.botSilencedAt).getTime())) {
    dates.push(conversation.botSilencedAt);
  }
  conversation.derivationDates = dates;

  if (typeof payload.isSilenced === 'boolean') {
    const source = payload.isSilenced ? (payload.silencedBy || 'manual') : null;
    conversation.isSilenced = payload.isSilenced;
    conversation.silencedBy = source;
    conversation.isDesilenced = !payload.isSilenced;

    if (payload.isSilenced && source === 'bot') {
      if (!wasPending) {
        conversation.botSilencedAt = now;
        conversation.derivationDates.push(now);
        conversation.contactedAt = null;
      }
      conversation.contactStatus = 'pending_contact';
    } else if (!payload.isSilenced) {
      conversation.contactStatus = 'in_bot';
      conversation.contactedAt = null;
    }
  }

  if (payload.contactStatus !== undefined) {
    conversation.contactStatus = payload.contactStatus;
    conversation.contactedAt = payload.contactStatus === 'contacted'
      ? (conversation.contactedAt || now)
      : null;
  }

  conversation.updatedAt = now;
}

module.exports = { applyConversationState };
