export function menuPosition(rect:{left:number;bottom:number;width:number},viewport:{left:number;top:number;width:number;height:number},minimumWidth=0){
  const gap=4,edge=8;
  const width=Math.min(Math.max(rect.width,minimumWidth),Math.max(0,viewport.width-edge*2));
  const top=rect.bottom+gap;
  return {left:Math.max(viewport.left+edge,Math.min(rect.left,viewport.left+viewport.width-width-edge)),top,width,maxHeight:Math.max(0,Math.min(280,viewport.top+viewport.height-top-edge))};
}
