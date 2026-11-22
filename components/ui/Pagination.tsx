'use client';
import { useState } from 'react';

const pageSize = 24;

export function usePagination<T>(records: T[], searchKey: string) {
  const [position, setPosition] = useState({ searchKey, page: 1 });
  if (position.searchKey !== searchKey) setPosition({ searchKey, page: 1 });
  const pages = Math.ceil(records.length / pageSize);
  const page = Math.max(1, Math.min(position.searchKey === searchKey ? position.page : 1, pages));
  const start = (page - 1) * pageSize;
  return {
    items: records.slice(start, start + pageSize),
    page, pages,
    onPage: (next: number) => setPosition({ searchKey, page: next }),
  };
}

export function Pagination({ page, pages, onPage }: {
  page: number; pages: number; onPage: (next: number) => void;
}) {
  if (pages < 2) return null;
  const button = 'min-h-11 rounded-full border border-[var(--outline)] px-3 text-sm disabled:opacity-40';
  return <nav aria-label="Results pages" className="mt-3 flex flex-wrap items-center justify-center gap-3">
    <button type="button" className={button} disabled={page === 1} onClick={() => onPage(page - 1)}>Previous</button>
    <span aria-live="polite" className="text-sm tabular-nums">Page {page} of {pages}</span>
    <button type="button" className={button} disabled={page === pages} onClick={() => onPage(page + 1)}>Next</button>
  </nav>;
}
