export function recoverIntake(data:Record<string,unknown>){
 const text=(key:string)=>String(data[key]??'');
 const rawDate=text('clientDueDate');
 const parts=rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
 const candidate=parts?`${parts[3]}-${parts[2]}-${parts[1]}`:/^\d{4}-\d{2}-\d{2}/.test(rawDate)?rawDate.slice(0,10):'';
 const parsed=new Date(candidate+'T12:00:00Z');
 const due=Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===candidate?candidate:'';
 const all=(data.measurements&&typeof data.measurements==='object'?data.measurements:{}) as Record<string,number|string>;
 const keys=Array.isArray(data.activePointKeys)?data.activePointKeys.map(String):Object.keys(all);
 return {name:text('clientName'),phone:text('clientPhone'),email:text('clientEmail'),garment:text('clientGarment')||text('selectedTemplateName'),price:text('clientPrice'),due,notes:text('clientNotes'),chosenClient:text('selectedClientId'),gender:data.gender==='male'?'male' as const:'female' as const,measurements:Object.fromEntries(keys.filter(k=>all[k]!==undefined).map(k=>[k,all[k]])),images:(Array.isArray(data.styleImages)?data.styleImages:[]).filter((url):url is string=>typeof url==='string').map((url,i)=>({id:`recovered-${i}`,url,title:`Style reference ${i+1}`})),dateNeedsReview:!!rawDate&&!due};
}
