// Standalone Apps Script preview. No mail writes, triggers or GA4 sends.
function previewPaidBookings() {
  var properties = PropertiesService.getScriptProperties();
  var sender = String(properties.getProperty('TRUSTED_SENDER') || '').trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(sender)) {
    throw new Error('Set TRUSTED_SENDER to the original receipt sender address.');
  }
  var rawDays = properties.getProperty('LOOKBACK_DAYS');
  var days = rawDays === null ? 7 : Number(rawDays);
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new Error('LOOKBACK_DAYS must be an integer from 1 to 30.');
  }
  var token = ScriptApp.getOAuthToken();
  var query = 'from:' + sender + ' subject:"New Booking" newer_than:' + days + 'd';
  var list = readGmail_('messages?maxResults=50&q=' + encodeURIComponent(query), token);
  if (list.messages !== undefined && !Array.isArray(list.messages)) {
    throw new Error('Invalid Gmail message list.');
  }
  var messages = (list.messages || []).slice(0, 50).map(function (entry) {
    if (!entry || typeof entry.id !== 'string' || !/^[a-f0-9]+$/i.test(entry.id)) {
      throw new Error('Invalid Gmail message identifier.');
    }
    return readGmail_('messages/' + encodeURIComponent(entry.id) + '?format=full', token);
  });
  messages.sort(function (a, b) {
    return Number(b.internalDate) - Number(a.internalDate) || String(a.id).localeCompare(String(b.id));
  });
  var seen = new Set();
  var result = {
    candidates: [],
    counts: { scanned: messages.length, eligible: 0, duplicates: 0, rejected: 0 },
    has_more_messages: typeof list.nextPageToken === 'string' && list.nextPageToken.length > 0,
  };
  messages.forEach(function (message) {
    var candidate = paidReceipt_(message, sender);
    if (!candidate) {
      result.counts.rejected++;
    } else if (seen.has(candidate.booking_id)) {
      result.counts.duplicates++;
    } else {
      seen.add(candidate.booking_id);
      result.candidates.push(candidate);
    }
  });
  result.counts.eligible = result.candidates.length;
  Logger.log(JSON.stringify(result));
  return result;
}

function readGmail_(path, token) {
  var response;
  try {
    response = UrlFetchApp.fetch('https://gmail.googleapis.com/gmail/v1/users/me/' + path, {
      method: 'get', followRedirects: false,
      headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true,
    });
  } catch {
    throw new Error('Gmail request failed before returning a response.');
  }
  var status = response.getResponseCode();
  if (status !== 200) throw new Error('Gmail read failed (HTTP ' + status + ').');
  var data;
  try {
    data = JSON.parse(response.getContentText());
  } catch {
    throw new Error('Invalid Gmail JSON response.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid Gmail response.');
  return data;
}

function paidReceipt_(message, sender) {
  if (!message || !message.payload) return null;
  var headers = message.payload.headers || [];
  if (!Array.isArray(headers)) return null;
  var from = singleHeader_(headers, 'from');
  var subject = singleHeader_(headers, 'subject');
  if (!from || !subject || subject.trim().toLowerCase() !== 'new booking') return null;
  var address = from.trim().match(/^(?:[^<>]*<([^<>\s]+)>|([^<>\s]+))$/);
  if (!address || (address[1] || address[2]).toLowerCase() !== sender) return null;
  var budget = { nodes: 200, bytes: 0, invalid: false };
  var body = receiptBody_(message.payload, 0, budget);
  if (!body || budget.invalid) return null;
  var text = body.html ? receiptText_(body.text) : body.text;
  text = text.replace(/\r\n?/g, '\n').replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{2,}/g, '\n');
  // Tags/entities can fragment forwarded or quoted markers, so test the normalized text.
  if (/forwarded message|begin forwarded|^On .+wrote:|^>/im.test(text)) return null;
  var idText = receiptField_(text, 'Booking Number', false);
  var paymentStatus = receiptField_(text, 'Booking Payment Status', false);
  var currency = receiptField_(text, 'Booking Currency', false);
  var total = receiptField_(text, 'Total', true);
  if (!idText || !paymentStatus || !currency || !total) return null;
  if (paymentStatus.replace(/\.$/, '').trim().toLowerCase() !== 'paid') return null;
  idText = idText.replace(/\.$/, '').trim();
  currency = currency.replace(/\.$/, '').trim().toUpperCase();
  var id = Number(idText);
  if (!/^\d+$/.test(idText) || !Number.isSafeInteger(id) || id <= 0 || !/^[A-Z]{3}$/.test(currency)) return null;
  var money = total.match(/^([^\d+\-]*)(\d+(?:,\d{3})*\.\d{2})$/);
  if (!money) return null;
  var prefix = money[1].trim();
  var symbols = { EUR: '€', USD: '$', GBP: '£' };
  if (prefix && prefix !== currency && prefix !== symbols[currency]) return null;
  // Money must parse as safe-integer cents; oversized amounts are rejected, not approximated.
  var cents = parseCents_(money[2]);
  if (cents === null) return null;
  var value = cents / 100;
  var received = Number(message.internalDate);
  if (!Number.isSafeInteger(received) || received <= 0) return null;
  var date = new Date(received);
  if (!Number.isFinite(date.getTime())) return null;
  return { booking_id: String(id), payment_status: 'paid', value: value, currency: currency, received_at: date.toISOString() };
}

function singleHeader_(headers, name) {
  var matches = headers.filter(function (header) {
    return header && typeof header.name === 'string' && header.name.toLowerCase() === name;
  });
  return matches.length === 1 && typeof matches[0].value === 'string' ? matches[0].value : null;
}

// Skip attachments and bound per-message MIME node count, depth and decoded bytes.
// Any exceeded limit sets budget.invalid so the WHOLE message is rejected — a later
// invalid sibling can never leave an earlier valid body silently accepted.
function receiptBody_(part, depth, budget) {
  if (!part || typeof part !== 'object') return null;
  if (depth > 12 || budget.nodes <= 0) {
    budget.invalid = true;
    return null;
  }
  if (part.filename) return null; // attachments are skipped and do not count their content
  budget.nodes -= 1;
  var type = String(part.mimeType || '').toLowerCase();
  if (type === 'text/plain' || type === 'text/html') {
    var data = part.body && typeof part.body.data === 'string' ? part.body.data : null;
    if (data === null) return null;
    if (data.length > 400000) {
      budget.invalid = true;
      return null;
    }
    var bytes;
    try {
      bytes = Utilities.base64DecodeWebSafe(data);
    } catch {
      budget.invalid = true;
      return null;
    }
    budget.bytes += bytes.length;
    if (budget.bytes > 300000) {
      budget.invalid = true;
      return null;
    }
    return { text: Utilities.newBlob(bytes).getDataAsString('UTF-8'), html: type === 'text/html' };
  }
  if (!Array.isArray(part.parts) || part.parts.length === 0) return null;
  if (part.parts.length > 30) {
    budget.invalid = true;
    return null;
  }
  var bodies = [];
  for (var i = 0; i < part.parts.length; i++) {
    var child = receiptBody_(part.parts[i], depth + 1, budget);
    if (child) bodies.push(child);
  }
  if (bodies.length === 0) return null;
  if (bodies.length === 1) return bodies[0];
  // More than one usable sibling body is only a plain + HTML pair inside
  // multipart/alternative; any other mix (e.g. both inline under multipart/mixed)
  // is an ambiguous receipt and rejects the whole message.
  if (type !== 'multipart/alternative' || bodies.length > 2 || bodies[0].html === bodies[1].html) {
    budget.invalid = true;
    return null;
  }
  var plain = bodies[0].html ? bodies[1] : bodies[0];
  var html = bodies[0].html ? bodies[0] : bodies[1];
  // An empty plaintext must not hide a usable HTML alternative.
  if (plain.text.replace(/\s/g, '').length > 0) return plain;
  return html;
}

// Validates thousand grouping and converts the amount to safe-integer cents; null when unsafe.
function parseCents_(amount) {
  var match = amount.match(/^([1-9]\d{0,2}(?:,\d{3})+|\d+)\.(\d{2})$/);
  if (!match) return null;
  var cents = BigInt(match[1].replace(/,/g, '')) * 100n + BigInt(match[2]);
  return cents > BigInt(Number.MAX_SAFE_INTEGER) ? null : Number(cents);
}

function receiptText_(html) {
  var text = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|head|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\b[^>]*>|<\/(?:p|div|tr|li|h[1-6])\s*>/gi, '\n')
    .replace(/<\/(?:td|th)\s*>/gi, '\t').replace(/<[^>]*>/g, '');
  var entities = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", euro: '€', pound: '£', dollar: '$' };
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, function (match, entity) {
    if (entity[0] !== '#') return entities[entity.toLowerCase()] || match;
    var point = /^#x/i.test(entity) ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : '';
  });
}

function receiptField_(text, label, nextLine) {
  var prefix = '^' + label.replace(/ /g, '[ \\t]+') + '[ \\t]*:';
  if ((text.match(new RegExp(prefix, 'gim')) || []).length !== 1) return null;
  var expression = prefix + '[ \\t]*' + (nextLine ? '(?:\\n[ \\t]*)?' : '') + '([^\\n]+)$';
  var match = text.match(new RegExp(expression, 'im'));
  return match ? match[1].trim() : null;
}
