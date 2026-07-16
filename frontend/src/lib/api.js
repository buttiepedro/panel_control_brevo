const API_BASE = '/api';

function buildHeaders(password, withJson = false) {
  const headers = {};
  if (password) headers['x-api-password'] = password;
  if (withJson) headers['Content-Type'] = 'application/json';
  return headers;
}

async function parseResponse(response) {
  if (!response.ok) {
    let message = 'Error inesperado';
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function fetchConversations(password) {
  const response = await fetch(`${API_BASE}/conversations`, {
    headers: buildHeaders(password),
  });
  return parseResponse(response);
}

export async function updateConversation(phoneNumber, payload, password) {
  const response = await fetch(`${API_BASE}/conversations/${encodeURIComponent(phoneNumber)}`, {
    method: 'PUT',
    headers: buildHeaders(password, true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function deleteConversation(phoneNumber, password) {
  const response = await fetch(`${API_BASE}/conversations/${encodeURIComponent(phoneNumber)}`, {
    method: 'DELETE',
    headers: buildHeaders(password),
  });
  return parseResponse(response);
}
