import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceCode = readFileSync(path.join(here, 'Code.gs'), 'utf8');

const sender = 'receipts@example.test';
const gmailBase = 'https://gmail.googleapis.com/gmail/v1/users/me/';
const expectedQuery = `from:${sender} subject:"New Booking" newer_than:7d`;
const listUrl = `${gmailBase}messages?maxResults=50&q=${encodeURIComponent(expectedQuery)}`;
const messageUrl = (id) => `${gmailBase}messages/${encodeURIComponent(id)}?format=full`;

// 2026 timestamps, 10s and 60s apart.
const T0 = 1793491200000;

const websafeB64 = (text) => Buffer.from(text, 'utf8').toString('base64url');

function plainReceipt(bookingNumber, status) {
  return [
    `Booking Number: ${bookingNumber}`,
    `Booking Payment Status: ${status}`,
    'Booking Currency: EUR',
    'Customer Name: Test Booker Seven',
    'Customer Email: booker7@synthetic.test',
    'Customer Phone: +00 000 000 0007',
    'Subtotal: €120.00',
    'Discount: €20.00',
    'Total: €100.00',
  ].join('\n');
}

const realTemplateHtml = () => '<p>Booking Number: 9103</p><p>Booking Payment Status: Paid</p>'
  + '<p>Booking Currency: EUR</p><p>Customer Name: Test Booker Seven</p>'
  + '<p>Customer Email: booker7@synthetic.test</p>'
  + '<table><tr><td><p>Subtotal:</p></td><td><b>&euro;120.00</b></td></tr>'
  + '<tr><td><p>Discount:</p></td><td><b>&euro;20.00</b></td></tr>'
  + '<tr><td><p>Total:</p></td><td><b>&euro;100.00</b></td></tr></table>';

function htmlReceiptPayload(html) {
  return {
    mimeType: 'multipart/mixed',
    body: { size: 0 },
    parts: [
      {
        mimeType: 'multipart/alternative',
        body: { size: 0 },
        parts: [
          { mimeType: 'text/plain', body: { size: 0, data: websafeB64('') } },
          { mimeType: 'text/html', body: { size: 0, data: websafeB64(html) } },
        ],
      },
    ],
  };
}

function gmailMessage(id, internalDate, options = {}) {
  const { from = sender, subject = 'New Booking' } = options;
  const payload = {
    headers: [
      { name: 'From', value: from },
      { name: 'To', value: 'booker7@synthetic.test' },
      { name: 'Subject', value: subject },
      { name: 'Date', value: new Date(internalDate).toUTCString() },
    ],
  };
  if (options.payload) {
    Object.assign(payload, options.payload);
  } else {
    payload.mimeType = 'text/plain';
    payload.body = { size: 0, data: websafeB64(options.text === undefined ? '' : options.text) };
  }
  return { id, threadId: `thread-${id}`, internalDate: String(internalDate), payload };
}

function jsonResponse(status, body) {
  return {
    getResponseCode: () => status,
    getContentText: () => JSON.stringify(body),
  };
}

function installMessageList(fixtures, messageIds, extra) {
  fixtures.set(listUrl, jsonResponse(200, {
    messages: messageIds.map((id) => ({ id })),
    resultSizeEstimate: messageIds.length,
    ...extra,
  }));
  return fixtures;
}

function installMessages(fixtures, messages) {
  for (const message of messages) {
    fixtures.set(messageUrl(message.id), jsonResponse(200, message));
  }
  return fixtures;
}

function createSandbox({ fixtures, properties = {} } = {}) {
  const requests = [];
  const logs = [];
  const props = { TRUSTED_SENDER: sender, ...properties };
  const mocks = {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => (Object.prototype.hasOwnProperty.call(props, key) ? props[key] : null),
      }),
    },
    ScriptApp: { getOAuthToken: () => 'test-oauth-token' },
    UrlFetchApp: {
      fetch: (url, options) => {
        requests.push({ url, options });
        const response = fixtures.get(url);
        if (response === undefined) throw new Error('Unexpected UrlFetchApp.fetch URL: ' + url);
        if (response && typeof response === 'object' && response.transportFailure) {
          throw new Error(response.transportFailure);
        }
        return response;
      },
    },
    Utilities: {
      base64DecodeWebSafe: (data) => Buffer.from(String(data), 'base64url'),
      newBlob: (bytes) => ({ getDataAsString: () => bytes.toString('utf8') }),
    },
    Logger: { log: (message) => logs.push(String(message)) },
  };
  const context = vm.createContext(mocks);
  vm.runInContext(sourceCode, context, { filename: 'Code.gs' });
  return { context, requests, logs };
}

// Cross-realm objects must be JSON-normalized before strict deepEqual; source never does this.
const normalizeVmValue = (value) => JSON.parse(JSON.stringify(value));

function expectPreviewError(context) {
  try {
    context.previewPaidBookings();
  } catch (error) {
    return error;
  }
  assert.fail('previewPaidBookings did not throw');
}

test('previewPaidBookings scans four exact-subject New Booking receipts and returns only the paid booking', () => {
  const messages = [
    { id: 'a1', internalDate: T0, text: plainReceipt('9101', 'Pending') },
    { id: 'a2', internalDate: T0 + 10000, text: plainReceipt('9101', 'Not Paid') },
    { id: 'a3', internalDate: T0 + 20000, text: plainReceipt('9102', 'Pending') },
    { id: 'a4', internalDate: T0 + 30000, text: plainReceipt('9102', 'Paid') },
  ];
  const gmailMessages = messages.map((spec, index) => gmailMessage(spec.id, spec.internalDate, { text: spec.text }));
  const fixtures = installMessages(installMessageList(new Map(), ['a1', 'a2', 'a3', 'a4']), gmailMessages);
  const { context, requests, logs } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.equal(requests.length, 5);
  for (const request of requests) {
    assert.equal(request.options && request.options.method, 'get');
    assert.ok(request.url.startsWith(gmailBase), 'every request must be a Gmail API GET');
  }

  assert.deepEqual(result.counts, { scanned: 4, eligible: 1, duplicates: 0, rejected: 3 });
  assert.equal(result.has_more_messages, false);
  assert.equal(result.candidates.length, 1);

  const candidate = result.candidates[0];
  // The accepted Paid message carries synthetic customer data; only whitelisted keys may appear.
  assert.deepEqual(Object.keys(candidate).sort(), ['booking_id', 'currency', 'payment_status', 'received_at', 'value']);
  assert.deepEqual(
    { booking_id: candidate.booking_id, payment_status: candidate.payment_status, value: candidate.value, currency: candidate.currency },
    { booking_id: '9102', payment_status: 'paid', value: 100, currency: 'EUR' },
  );
  assert.equal(candidate.received_at, new Date(T0 + 30000).toISOString());

  const serialized = `${JSON.stringify(result)}\n${logs.join('\n')}`;
  for (const customerToken of ['synthetic.test', 'Booker', 'booker7', '+00 000 000 0007', 'Customer ']) {
    assert.ok(!serialized.includes(customerToken), `output must not contain customer data: ${customerToken}`);
  }
});

test('duplicate Paid copies keep the newest received_at and a later Pending does not hide Paid', () => {
  const messages = [
    { id: 'b1', internalDate: T0, text: plainReceipt('9101', 'Paid') },
    { id: 'b2', internalDate: T0 + 60000, text: plainReceipt('9101', 'Pending') },
    { id: 'b3', internalDate: T0 + 120000, text: plainReceipt('9101', 'Paid') },
  ];
  const gmailMessages = messages.map((spec) => gmailMessage(spec.id, spec.internalDate, { text: spec.text }));
  const fixtures = installMessages(installMessageList(new Map(), ['b1', 'b2', 'b3']), gmailMessages);
  const { context } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.deepEqual(result.counts, { scanned: 3, eligible: 1, duplicates: 1, rejected: 1 });
  assert.equal(result.candidates.length, 1);
  assert.deepEqual(
    { booking_id: result.candidates[0].booking_id, payment_status: result.candidates[0].payment_status },
    { booking_id: '9101', payment_status: 'paid' },
  );
  assert.equal(result.candidates[0].received_at, new Date(T0 + 120000).toISOString());
});

test('HTML-only nested MIME with the real table template, &euro; and empty plain alternative picks the final Total', () => {
  const message = gmailMessage('c1', T0, { payload: htmlReceiptPayload(realTemplateHtml()) });
  const fixtures = installMessages(installMessageList(new Map(), ['c1']), [message]);
  const { context } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.deepEqual(result.counts, { scanned: 1, eligible: 1, duplicates: 0, rejected: 0 });
  // The table rows carry Subtotal 120 and Discount 20; the final Total 100 must win.
  assert.deepEqual(
    { booking_id: result.candidates[0].booking_id, value: result.candidates[0].value, currency: result.candidates[0].currency, payment_status: result.candidates[0].payment_status },
    { booking_id: '9103', value: 100, currency: 'EUR', payment_status: 'paid' },
  );
  assert.equal(result.candidates[0].received_at, new Date(T0).toISOString());
});

test('invalid, missing, duplicate fields and ambiguous amounts are all rejected', () => {
  const cases = [
    { id: 'd1', name: 'missing booking number', text: 'Booking Payment Status: Paid\nBooking Currency: EUR\nTotal: €100.00' },
    { id: 'd2', name: 'missing currency', text: 'Booking Number: 9104\nBooking Payment Status: Paid\nTotal: €100.00' },
    { id: 'd3', name: 'duplicate booking number', text: 'Booking Number: 9104\nBooking Number: 9105\nBooking Payment Status: Paid\nBooking Currency: EUR\nTotal: €100.00' },
    { id: 'd4', name: 'duplicate total', text: `${plainReceipt('9104', 'Paid')}\nTotal: €50.00` },
    { id: 'd5', name: 'worse amount precision', text: 'Booking Number: 9104\nBooking Payment Status: Paid\nBooking Currency: EUR\nTotal: €100.0' },
    { id: 'd6', name: 'mismatched currency prefix', text: 'Booking Number: 9104\nBooking Payment Status: Paid\nBooking Currency: EUR\nTotal: $100.00' },
  ];
  const messages = cases.map((item, index) => gmailMessage(item.id, T0 + index, { text: item.text }));
  const fixtures = installMessages(installMessageList(new Map(), cases.map((item) => item.id)), messages);
  const { context } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.deepEqual(result.counts, { scanned: 6, eligible: 0, duplicates: 0, rejected: 6 });
  assert.deepEqual(result.candidates, []);
});

test('exact Not Paid is rejected, not approximated to Paid', () => {
  const message = gmailMessage('e1', T0, { text: plainReceipt('9104', 'Not Paid') });
  const fixtures = installMessages(installMessageList(new Map(), ['e1']), [message]);
  const { context } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.deepEqual(result.counts, { scanned: 1, eligible: 0, duplicates: 0, rejected: 1 });
  assert.deepEqual(result.candidates, []);
});

test('forwarded envelopes, quoted bodies and forged trusted From are rejected', () => {
  const cases = [
    { id: 'f1', name: 'forwarded marker', text: `---------- Forwarded message ---------\nFrom: other@synthetic.test\n\n${plainReceipt('9105', 'Paid')}` },
    { id: 'f2', name: 'quoted body', text: plainReceipt('9105', 'Paid').split('\n').map((line) => `> ${line}`).join('\n') },
    { id: 'f3', name: 'wrote line', text: `On Tue, 3 Nov 2026 at 10:00, Other Person <other@synthetic.test> wrote:\n${plainReceipt('9105', 'Paid')}` },
    { id: 'f4', name: 'forged trusted From in body', from: 'impostor@example.test', text: `From: ${sender}\n${plainReceipt('9105', 'Paid')}` },
    {
      id: 'f5',
      name: 'quoted marker fragmented by HTML entities',
      text: null,
      payload: htmlReceiptPayload(
        '<div>&gt; Booking Number: 9105</div><div>&gt; Booking Payment Status: Paid</div>'
        + '<div>&gt; Booking Currency: EUR</div><div>&gt; Total: &euro;100.00</div>',
      ),
    },
  ];
  const messages = cases.map((item, index) => gmailMessage(item.id, T0 + index, {
    from: item.from,
    text: item.text === undefined ? undefined : item.text,
    payload: item.payload,
  }));
  const fixtures = installMessages(installMessageList(new Map(), cases.map((item) => item.id)), messages);
  const { context } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.deepEqual(result.counts, { scanned: 5, eligible: 0, duplicates: 0, rejected: 5 });
  assert.deepEqual(result.candidates, []);
});

test('Gmail 401 and transport failures never leak tokens or raw bodies', () => {
  const secretBody = {
    error: { code: 401, message: 'Bearer test-oauth-token rejected', details: 'Booking Number: 9110, Customer Name: Secret Sam' },
  };

  const unauthorizedFixtures = new Map();
  unauthorizedFixtures.set(listUrl, jsonResponse(401, secretBody));
  const unauthorized = createSandbox({ fixtures: unauthorizedFixtures });
  const unauthorizedError = expectPreviewError(unauthorized.context);
  assert.equal(unauthorizedError.message, 'Gmail read failed (HTTP 401).');
  const unauthorizedLeak = `${unauthorizedError.message}\n${unauthorized.logs.join('\n')}`;
  for (const secretToken of ['test-oauth-token', 'Bearer', '9110', 'Secret Sam']) {
    assert.ok(!unauthorizedLeak.includes(secretToken), `error must not contain: ${secretToken}`);
  }

  const transportFixtures = new Map();
  transportFixtures.set(listUrl, {
    transportFailure: 'push failed near bearer test-oauth-token with raw Booking Number: 9110',
  });
  const transport = createSandbox({ fixtures: transportFixtures });
  const transportError = expectPreviewError(transport.context);
  assert.equal(transportError.message, 'Gmail request failed before returning a response.');
  const transportLeak = `${transportError.message}\n${transport.logs.join('\n')}`;
  for (const secretToken of ['test-oauth-token', 'Bearer', '9110']) {
    assert.ok(!transportLeak.includes(secretToken), `error must not contain: ${secretToken}`);
  }
});

test('attachment-only and oversized MIME bodies are rejected; attachments do not block text alternatives', () => {
  const attachmentPayload = {
    mimeType: 'multipart/mixed',
    body: { size: 0 },
    parts: [
      { mimeType: 'application/pdf', filename: 'invoice.pdf', size: 1200, body: { size: 1200, data: websafeB64('%PDF synthetic') } },
    ],
  };
  const alternativeWithAttachmentPayload = {
    mimeType: 'multipart/mixed',
    body: { size: 0 },
    parts: [
      {
        mimeType: 'multipart/alternative',
        body: { size: 0 },
        parts: [
          { mimeType: 'text/plain', body: { size: 0, data: websafeB64(plainReceipt('9107', 'Paid')) } },
          { mimeType: 'text/html', body: { size: 0, data: websafeB64('<p>Booking Number: 9107</p><p>Booking Payment Status: Paid</p><p>Booking Currency: EUR</p><p>Total: &euro;100.00</p>') } },
        ],
      },
      { mimeType: 'application/pdf', filename: 'invoice.pdf', size: 300, body: { size: 300, data: websafeB64('%PDF synthetic') } },
    ],
  };
  const oversizedText = `${plainReceipt('9107', 'Paid')}\nNote: ${'A'.repeat(300100)}`;
  const messages = [
    gmailMessage('ca1', T0, { payload: attachmentPayload }),
    gmailMessage('ca2', T0 + 10000, { text: oversizedText }),
    gmailMessage('ca3', T0 + 20000, { payload: alternativeWithAttachmentPayload }),
  ];
  const fixtures = installMessages(installMessageList(new Map(), ['ca1', 'ca2', 'ca3']), messages);
  const { context } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.deepEqual(result.counts, { scanned: 3, eligible: 1, duplicates: 0, rejected: 2 });
  assert.equal(result.candidates[0].booking_id, '9107');
});

test('a later sibling breaking node, byte, depth or part limits rejects the whole message', () => {
  const paidFields = () => ({ mimeType: 'text/plain', body: { size: 0, data: websafeB64(plainReceipt('9112', 'Paid')) } });
  const oversizedSibling = { mimeType: 'text/plain', body: { size: 0, data: websafeB64(`Padding: ${'A'.repeat(300100)}`) } };
  let deepNode = paidFields();
  for (let level = 0; level < 14; level += 1) {
    deepNode = { mimeType: 'multipart/mixed', body: { size: 0 }, parts: [deepNode] };
  }
  // Body-less leaves keep the part/node counts high while producing no usable text,
  // so only the exhausted node budget can flag this structure; depth stays within 12.
  let wideNode = null;
  for (let level = 0; level < 8; level += 1) {
    const children = Array.from({ length: 29 }, () => ({ mimeType: 'text/plain', body: { size: 0 } }));
    if (wideNode) children.push(wideNode);
    wideNode = { mimeType: 'multipart/mixed', body: { size: 0 }, parts: children };
  }
  const wrap = (id, offset, sibling) => gmailMessage(id, T0 + offset, {
    payload: { mimeType: 'multipart/mixed', body: { size: 0 }, parts: [paidFields(), sibling] },
  });
  const messages = [
    wrap('cd1', 0, oversizedSibling),
    wrap('cd2', 10000, deepNode),
    wrap('cd3', 20000, wideNode),
  ];
  const fixtures = installMessages(installMessageList(new Map(), ['cd1', 'cd2', 'cd3']), messages);
  const { context } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.deepEqual(result.counts, { scanned: 3, eligible: 0, duplicates: 0, rejected: 3 });
  assert.deepEqual(result.candidates, []);
});

test('a plain+HTML pair is only accepted inside multipart/alternative, never multipart/mixed', () => {
  const mixedPairPayload = {
    mimeType: 'multipart/mixed',
    body: { size: 0 },
    parts: [
      { mimeType: 'text/plain', body: { size: 0, data: websafeB64(plainReceipt('9113', 'Paid')) } },
      { mimeType: 'text/html', body: { size: 0, data: websafeB64('<p>Booking Number: 9113</p><p>Booking Payment Status: Paid</p><p>Booking Currency: EUR</p><p>Total: &euro;100.00</p>') } },
    ],
  };
  const message = gmailMessage('da1', T0, { payload: mixedPairPayload });
  const fixtures = installMessages(installMessageList(new Map(), ['da1']), [message]);
  const { context } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.deepEqual(result.counts, { scanned: 1, eligible: 0, duplicates: 0, rejected: 1 });
  assert.deepEqual(result.candidates, []);
});

test('amounts beyond safe-integer cents are rejected and boundary amounts parse exactly', () => {
  const messages = [
    gmailMessage('cb1', T0, { text: 'Booking Number: 9108\nBooking Payment Status: Paid\nBooking Currency: EUR\nTotal: €90,071,992,547,409.92' }),
    gmailMessage('cb2', T0 + 10000, { text: 'Booking Number: 9109\nBooking Payment Status: Paid\nBooking Currency: EUR\nTotal: €90,071,992,547,409.00' }),
  ];
  const fixtures = installMessages(installMessageList(new Map(), ['cb1', 'cb2']), messages);
  const { context } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.deepEqual(result.counts, { scanned: 2, eligible: 1, duplicates: 0, rejected: 1 });
  assert.deepEqual(
    { booking_id: result.candidates[0].booking_id, value: result.candidates[0].value, currency: result.candidates[0].currency },
    { booking_id: '9109', value: 90071992547409, currency: 'EUR' },
  );
});

test('has_more_messages signals Gmail list truncation instead of a complete mailbox scan', () => {
  const messages = [
    gmailMessage('cc1', T0, { text: plainReceipt('9110', 'Paid') }),
    gmailMessage('cc2', T0 + 10000, { text: plainReceipt('9111', 'Paid') }),
  ];
  const fixtures = installMessages(installMessageList(new Map(), ['cc1', 'cc2'], { nextPageToken: 'page-next-token' }), messages);
  const { context } = createSandbox({ fixtures });
  const result = normalizeVmValue(context.previewPaidBookings());

  assert.deepEqual(result.counts, { scanned: 2, eligible: 2, duplicates: 0, rejected: 0 });
  assert.equal(result.has_more_messages, true);
  assert.deepEqual(
    result.candidates.map((candidate) => candidate.booking_id),
    ['9111', '9110'],
  );
});
