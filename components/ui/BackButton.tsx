'use client';
import type {ButtonHTMLAttributes} from 'react';
import {cn} from '@/lib/utils';
export function BackButton({children='Back',className,...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button type="button" {...props} className={cn('inline-flex min-h-11 w-fit items-center gap-1 text-xs font-normal text-[#595959] hover:text-black focus-visible:outline-2 focus-visible:outline-[var(--primary)] disabled:opacity-50',className)}><img src="/icons/order-details/arrow-u-up-left.svg" alt="" width={16} height={16} className="h-4 w-4 shrink-0"/>{children}</button>}
