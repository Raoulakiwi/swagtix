export type QRPayload = {
  ticketId: string;
  eventId: string;
  seatID?: string;
  seatIdentifier?: string;
};

const tryParseJson = (s: string) => {
  try { return JSON.parse(s); } catch { return null; }
};

export function parseQrPayload(raw: string): QRPayload {
  if (!raw || typeof raw !== 'string') throw new Error('Empty QR data');

  // Handle extra quotes or single quotes
  const candidates = [raw, raw.trim().replace(/^'+|'+$/g, ''), raw.trim().replace(/^"+|"+$/g, ''), raw.replace(/'/g, '"')];

  let obj: any = null;
  for (const c of candidates) {
    const parsed = tryParseJson(c);
    if (parsed && typeof parsed === 'object') { obj = parsed; break; }
  }

  if (!obj) throw new Error('QR is not valid JSON');

  if (typeof obj.qrCodeValue === 'string') {
    const nested = tryParseJson(obj.qrCodeValue) || tryParseJson(obj.qrCodeValue.replace(/'/g, '"'));
    if (nested) obj = nested;
  }

  const ticketId = obj.ticketId || obj.ticketID || obj.id;
  const eventId = obj.eventId || obj.eventID || obj.event;
  const seatID = obj.seatID || obj.seatId || '';
  const seatIdentifier = obj.seatIdentifier || obj.seat || '';

  if (!ticketId || !eventId) throw new Error('QR missing ticketId or eventId');

  return { ticketId: String(ticketId), eventId: String(eventId), seatID: seatID ? String(seatID) : undefined, seatIdentifier: seatIdentifier ? String(seatIdentifier) : undefined };
}
