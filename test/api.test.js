const { before, after, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const express = require('express');
const Conversation = require('../models/Conversation');
const routes = require('../routes/api');

const originalFindOne = Conversation.findOne;
const originalSave = Conversation.prototype.save;
const originalPassword = process.env.ADMIN_PASSWORD;
const password = randomUUID();
let stored;
let server;
let baseUrl;

before(async () => {
  process.env.ADMIN_PASSWORD = password;
  Conversation.findOne = async ({ phoneNumber }) =>
    stored && stored.phoneNumber === phoneNumber ? new Conversation(stored) : null;
  Conversation.prototype.save = async function () {
    await this.validate();
    stored = this.toObject();
    return this;
  };
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

beforeEach(() => {
  stored = null;
});

after(async () => {
  Conversation.findOne = originalFindOne;
  Conversation.prototype.save = originalSave;
  if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = originalPassword;
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

async function request(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-api-password': password },
    body: JSON.stringify(body)
  });
  assert.equal(response.status, 200);
  return response.json();
}

test('message and update endpoints preserve context and handoff history through the full workflow', async () => {
  const payload = {
    phoneNumber: '5491100000000',
    whatsappName: 'Prueba',
    lastUserMessage: 'Consulta completa',
    derivationReason: 'Necesita asesor',
    isSilenced: true,
    silencedBy: 'bot'
  };
  const created = await request('POST', '/message', payload);
  assert.equal(created.created, true);
  assert.equal(created.contactStatus, 'pending_contact');
  const firstDate = stored.botSilencedAt.getTime();
  await request('POST', '/message', payload);
  assert.equal(stored.derivationDates.length, 1);
  assert.equal(stored.botSilencedAt.getTime(), firstDate);

  await request('PUT', `/conversations/${payload.phoneNumber}`, {
    contactStatus: 'contacted', isSilenced: true, silencedBy: 'manual'
  });
  assert.equal(stored.contactStatus, 'contacted');
  assert.equal(stored.botSilencedAt.getTime(), firstDate);
  assert.equal(stored.derivationDates.length, 1);
  assert.equal(stored.derivationReason, payload.derivationReason);
  assert.equal(stored.lastUserMessage, payload.lastUserMessage);

  await request('PUT', `/conversations/${payload.phoneNumber}`, { isSilenced: false });
  assert.equal(stored.isDesilenced, true);
  assert.equal(stored.botSilencedAt.getTime(), firstDate);
  await request('PUT', `/conversations/${payload.phoneNumber}`, { isSilenced: true, silencedBy: 'bot' });
  assert.equal(stored.contactStatus, 'pending_contact');
  assert.equal(stored.isDesilenced, false);
  assert.equal(stored.derivationDates.length, 2);
});

test('manual silencing through either endpoint does not confirm contact or hide pending work', async () => {
  await request('POST', '/message', { phoneNumber: '5491100000000' });
  await request('PUT', '/conversations/5491100000000', { isSilenced: true, silencedBy: 'manual' });
  assert.equal(stored.contactStatus, 'in_bot');
  assert.equal(stored.contactedAt, null);
  await request('PUT', '/conversations/5491100000000', { isSilenced: true, silencedBy: 'bot' });
  await request('POST', '/message', { phoneNumber: '5491100000000', isSilenced: true, silencedBy: 'manual' });
  assert.equal(stored.contactStatus, 'pending_contact');
  assert.equal(stored.contactedAt, null);
});
