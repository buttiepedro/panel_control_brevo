import test from 'node:test';
import assert from 'node:assert/strict';
import { findNewDerivations, isPendingContact, wasDerivedOn } from '../src/lib/conversations.js';

const yesterday = new Date(2026, 10, 16, 12).toISOString();
const today = new Date(2026, 10, 17, 12).toISOString();

test('daily handoff counts include contacted numbers and previous handoff days', () => {
  const conversation = {
    contactStatus: 'contacted', silencedBy: 'manual',
    botSilencedAt: today, derivationDates: [yesterday, today]
  };
  assert.equal(wasDerivedOn(conversation, today), true);
  assert.equal(wasDerivedOn(conversation, yesterday), true);
  assert.equal(isPendingContact(conversation), false);
  assert.equal(wasDerivedOn({ ...conversation, derivationDates: [], botSilencedAt: null, updatedAt: today }, today), false);
});

test('notifications detect new and repeated-number handoffs, not ordinary refreshes or contact updates', () => {
  const old = {
    phoneNumber: '1', contactStatus: 'contacted',
    derivationDates: [yesterday], botSilencedAt: yesterday
  };
  const repeated = { ...old, derivationDates: [yesterday, today], botSilencedAt: today };
  const fresh = { phoneNumber: '2', contactStatus: 'pending_contact', botSilencedAt: today };
  assert.deepEqual(findNewDerivations([old], [repeated, fresh]), [repeated, fresh]);
  assert.deepEqual(findNewDerivations([repeated, fresh], [repeated, fresh]), []);
  assert.deepEqual(findNewDerivations([fresh], [{ ...fresh, contactStatus: 'contacted', silencedBy: 'manual' }]), []);
});

test('legacy pending transitions trigger notifications without a timestamp', () => {
  const old = { phoneNumber: '1', contactStatus: 'in_bot' };
  const pending = { ...old, contactStatus: 'pending_contact' };
  assert.deepEqual(findNewDerivations([old], [pending]), [pending]);
  assert.deepEqual(findNewDerivations([pending], [pending]), []);
  assert.equal(isPendingContact({ isSilenced: true, silencedBy: 'bot', contactStatus: 'resolved' }), false);
});
