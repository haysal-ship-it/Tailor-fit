import { createHmac, timingSafeEqual } from 'node:crypto';

export type DeletionTicket =
  | { stage: 'started'; owner: string; verifier: Record<string, string> }
  | { stage: 'verified'; owner: string };

export function signTicket(ticket: DeletionTicket, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ ...ticket, expires: now + 5 * 60_000 })).toString('base64url');
  const signature = createHmac('sha256', secret).update('tailorfit:delete:' + payload).digest('base64url');
  return payload + '.' + signature;
}

export function readTicket(value: string | undefined, secret: string, now = Date.now()): DeletionTicket | null {
  if (!value || !secret) return null;
  const [payload, signature, extra] = value.split('.');
  if (!payload || !signature || extra !== undefined) return null;
  const expected = createHmac('sha256', secret).update('tailorfit:delete:' + payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (expected.length !== actual.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const ticket = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return ticket.expires > now ? ticket : null;
  } catch { return null; }
}
