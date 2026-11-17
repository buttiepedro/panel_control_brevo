const test = require('node:test');
const assert = require('node:assert/strict');
const { applyConversationState } = require('../routes/conversationState');

const first = new Date('2026-11-16T12:00:00Z');
const second = new Date('2026-11-17T12:00:00Z');
const handoff = { isSilenced: true, silencedBy: 'bot' };

test('a repeated pending handoff preserves its original wait time and history', () => {
  const conversation = { contactStatus: 'in_bot', isSilenced: false };
  applyConversationState(conversation, handoff, first);
  applyConversationState(conversation, handoff, second);
  assert.equal(conversation.contactStatus, 'pending_contact');
  assert.equal(conversation.botSilencedAt, first);
  assert.deepEqual(conversation.derivationDates, [first]);
});

test('contacting and reactivating preserve past handoffs; a new handoff adds a date', () => {
  const conversation = { contactStatus: 'in_bot' };
  applyConversationState(conversation, handoff, first);
  applyConversationState(conversation, {
    isSilenced: true, silencedBy: 'manual', contactStatus: 'contacted'
  }, second);
  assert.equal(conversation.contactStatus, 'contacted');
  assert.equal(conversation.contactedAt, second);
  assert.equal(conversation.botSilencedAt, first);
  applyConversationState(conversation, { isSilenced: false }, second);
  assert.equal(conversation.contactStatus, 'in_bot');
  assert.equal(conversation.silencedBy, null);
  assert.equal(conversation.isDesilenced, true);
  applyConversationState(conversation, handoff, second);
  assert.equal(conversation.contactedAt, null);
  assert.equal(conversation.isDesilenced, false);
  assert.deepEqual(conversation.derivationDates, [first, second]);
});

test('manual silencing neither marks a contact as contacted nor removes pending work', () => {
  for (const contactStatus of ['in_bot', 'pending_contact']) {
    const conversation = { contactStatus };
    applyConversationState(conversation, { isSilenced: true, silencedBy: 'manual' }, first);
    assert.equal(conversation.contactStatus, contactStatus);
    assert.equal(conversation.contactedAt, undefined);
    assert.deepEqual(conversation.derivationDates, []);
  }
});

test('legacy derivation dates survive updates without inventing unknown dates', () => {
  const legacy = { contactStatus: 'pending_contact', botSilencedAt: first };
  applyConversationState(legacy, { contactStatus: 'contacted' }, second);
  applyConversationState(legacy, { contactStatus: 'contacted' }, second);
  assert.deepEqual(legacy.derivationDates, [first]);
  const unknown = { contactStatus: 'pending_contact' };
  applyConversationState(unknown, {}, second);
  assert.deepEqual(unknown.derivationDates, []);
});
