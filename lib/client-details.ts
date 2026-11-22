export const CLIENT_NAME_LIMIT = 200;
export type ClientDetails = { name: string; phone: string; email: string; notes: string };
export type ClientDetailsTarget = { kind: 'create' } | { kind: 'edit'; client: ClientDetails & { id: string } };
export type ClientDetailsErrors = Partial<Record<keyof ClientDetails, string>>;
export const emptyClientDetails = (): ClientDetails => ({ name: '', phone: '', email: '', notes: '' });
export function normalizeClientDetails(values: ClientDetails): ClientDetails {
  return { name: values.name.trim(), phone: values.phone.trim(), email: values.email.trim(), notes: values.notes.trim() };
}
export function validateClientDetails(values: ClientDetails): ClientDetailsErrors {
  const data = normalizeClientDetails(values);
  const errors: ClientDetailsErrors = {};
  if (!data.name) errors.name = "Enter the client's full name.";
  else if (data.name.length > CLIENT_NAME_LIMIT) errors.name = `Use ${CLIENT_NAME_LIMIT} characters or fewer for the client name.`;
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address, or leave it blank.';
  return errors;
}
export function hasClientDetailsChanges(values: ClientDetails, original: ClientDetails): boolean {
  const current = normalizeClientDetails(values), initial = normalizeClientDetails(original);
  return (Object.keys(current) as (keyof ClientDetails)[]).some(key => current[key] !== initial[key]);
}
// Creation has no edit ID; an edit target is captured when the dialog opens.
// Never infer the operation from whichever profile happens to be selected later.
export async function saveClientDetails(
  target: ClientDetailsTarget,
  values: ClientDetails,
  actions: {
    create: (data: ClientDetails) => Promise<{ id: string; name: string } | null>;
    update: (id: string, data: ClientDetails) => Promise<boolean>;
  },
): Promise<{ id: string; name: string; created: boolean } | null> {
  if (Object.keys(validateClientDetails(values)).length) throw new Error('Review the highlighted client details.');
  const data = normalizeClientDetails(values);
  if (target.kind === 'create') {
    const client = await actions.create(data);
    return client ? { id: client.id, name: client.name, created: true } : null;
  }
  const saved = await actions.update(target.client.id, data);
  return saved ? { id: target.client.id, name: data.name, created: false } : null;
}
