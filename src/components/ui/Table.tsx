import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number | null;
  empty?: ReactNode;
}

/** 어드민 표: 머리는 회색 바탕, 줄은 헤어라인. 상자로 감싸지 않는다 */
export function Table<T>({ columns, rows, rowKey, onRowClick, selectedKey, empty }: TableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="bg-s1 text-meta text-muted">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn('h-10 px-3 font-medium', ALIGN[column.align ?? 'left'], column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => {
            const key = rowKey(row);
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'h-11',
                  onRowClick && 'cursor-pointer hover:bg-s1',
                  selectedKey === key && 'bg-primary-c hover:bg-primary-c',
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-3 py-2', ALIGN[column.align ?? 'left'], column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
