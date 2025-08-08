import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const checkInTicket = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { ticketId, eventId } = data || {};
  if (!ticketId || !eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'ticketId and eventId are required');
  }

  const ticketRef = db.collection('tickets').doc(String(ticketId));

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(ticketRef);
    if (!snap.exists) {
      return { status: 'invalid', message: 'Ticket not found' };
    }
    const ticket = snap.data() as any;

    if (String(ticket.eventId) !== String(eventId)) {
      return { status: 'invalid', message: 'Ticket is for a different event' };
    }

    if (ticket.checkedIn) {
      return { status: 'already', message: 'Already checked in', ticket: { ...ticket, ticketId } };
    }

    tx.update(ticketRef, {
      checkedIn: true,
      checkedInAt: admin.firestore.FieldValue.serverTimestamp(),
      checkedInBy: context.auth.uid,
      checkInEventId: eventId
    });

    const updated = { ...ticket, checkedIn: true, checkedInBy: context.auth.uid, checkInEventId: eventId };
    return { status: 'valid', ticket: { ...updated, ticketId } };
  });
});
