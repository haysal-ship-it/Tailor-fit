'use client';
import { ChoiceMenu, type Choice } from './ChoiceMenu';
export type SelectOption = Choice;
export function SpringSelect({options,value,onChange,placeholder='Select option',label,className}:{options:SelectOption[];value:string;onChange:(value:string)=>void;placeholder?:string;label?:string;className?:string}) {
  return <ChoiceMenu options={options} value={value} onChoose={onChange} placeholder={placeholder} label={label} className={className}/>;
}
