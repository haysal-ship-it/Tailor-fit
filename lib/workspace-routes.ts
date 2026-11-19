/** Retire old intake URLs without dropping a recoverable draft ID. */
export function normalizeWorkspaceUrl(url:URL){
 const oldTab=url.searchParams.get('tab');
 if(oldTab==='new-measurement'||oldTab==='edit-measurement'||url.searchParams.has('capture')){
  url.searchParams.set('tab',url.searchParams.get('client')?'clients':'overview');
  url.searchParams.delete('capture');url.searchParams.delete('order');
 }
 return url;
}
