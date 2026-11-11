export function safeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith('/app') || value.startsWith('//')) return '/app?tab=overview';
  try {
    const url = new URL(value, 'https://tailorfit.invalid');
    if (url.origin !== 'https://tailorfit.invalid' || url.pathname !== '/app') return '/app?tab=overview';
    const result = new URLSearchParams();
    const tab = url.searchParams.get('tab');
    result.set('tab', tab && ['overview', 'clients', 'settings'].includes(tab) ? tab : 'overview');
    const draft = url.searchParams.get('draft');
    if (draft && /^[0-9a-f-]{36}$/i.test(draft)) result.set('draft', draft);
    for(const key of ['client','order']){const id=url.searchParams.get(key);if(id&&(/^[0-9a-f-]{36}$/i.test(id)||key==='order'&&id==='new'))result.set(key,id);}
    return `/app?${result}`;
  } catch { return '/app?tab=overview'; }
}
