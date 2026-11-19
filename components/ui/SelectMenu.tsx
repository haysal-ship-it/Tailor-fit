'use client';
import {Children,isValidElement,type ReactNode,type ReactElement,type OptionHTMLAttributes} from 'react';
import {ChoiceMenu,type Choice} from './ChoiceMenu';

/** Option markup adapter for older forms; all menus use the same interactive component. */
export function SelectMenu({children,value,onValueChange,disabled=false,className='',label}:{children:ReactNode;value:string;onValueChange:(value:string)=>void;disabled?:boolean;className?:string;label?:string}){
  const options:Choice[]=[];
  function collect(nodes:ReactNode){Children.forEach(nodes,node=>{
    if(!isValidElement(node))return;
    const element=node as ReactElement<OptionHTMLAttributes<HTMLOptionElement>>;
    if(element.type==='option')options.push({value:String(element.props.value??''),label:String(element.props.label??Children.toArray(element.props.children).join('')),disabled:element.props.disabled});
    else if(element.props.children)collect(element.props.children);
  });}
  collect(children);
  return <ChoiceMenu options={options} value={value} onChoose={onValueChange} disabled={disabled} className={className} label={label}/>;
}
