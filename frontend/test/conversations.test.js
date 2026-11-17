import test from 'node:test';
import assert from 'node:assert/strict';
import { findNewDerivations, getConversationStatus, isPendingContact, isWithinDateRange, wasDerivedOn } from '../src/lib/conversations.js';

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

test('date ranges include the entire first and last local days', () => {
  const from = '2026-11-16';
  const to = '2026-11-17';
  assert.equal(isWithinDateRange(new Date(2026, 10, 16, 0).toISOString(), from, to), true);
  assert.equal(isWithinDateRange(new Date(2026, 10, 17, 23, 59, 59, 999).toISOString(), from, to), true);
  assert.equal(isWithinDateRange(new Date(2026, 10, 15, 23, 59, 59, 999).toISOString(), from, to), false);
  assert.equal(isWithinDateRange(new Date(2026, 10, 18, 0).toISOString(), from, to), false);
  assert.equal(isWithinDateRange(new Date(2026, 10, 17, 12).toISOString(), to, to), true);
});

test('date ranges allow open bounds and clearing but exclude missing dates when filtering', () => {
  assert.equal(isWithinDateRange(yesterday, '2026-11-17', ''), false);
  assert.equal(isWithinDateRange(today, '2026-11-17', ''), true);
  assert.equal(isWithinDateRange(yesterday, '', '2026-11-16'), true);
  assert.equal(isWithinDateRange(today, '', '2026-11-16'), false);
  assert.equal(isWithinDateRange(null, '', ''), true);
  assert.equal(isWithinDateRange(null, '2026-11-17', ''), false);
  assert.equal(isWithinDateRange('invalid', '', '2026-11-17'), false);
  assert.equal(isWithinDateRange(today, '2026-11-18', '2026-11-16'), false);
});

test('status filters match the four displayed tags, including legacy and overlapping states', () => {
  const cases = [
    [{ contactStatus: 'pending_contact', isSilenced: true, silencedBy: 'manual' }, 'pending'],
    [{ isSilenced: true, silencedBy: 'bot' }, 'pending'],
    [{ contactStatus: 'in_bot', isSilenced: true, silencedBy: 'manual' }, 'manual'],
    [{ contactStatus: 'contacted', isSilenced: true, silencedBy: 'bot' }, 'contacted'],
    [{ contactStatus: 'contacted', isSilenced: false }, 'contacted'],
    [{ contactStatus: 'in_bot', isSilenced: false }, 'bot']
  ];
  for (const [conversation, expected] of cases) {
    assert.equal(getConversationStatus(conversation), expected);
  }
});
