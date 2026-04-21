import React from 'react';
import {
  Table,
  flexRender,
  HeaderGroup,
  Row,
  Cell,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Skeleton from './Skeleton';

interface DataTableProps<TData> {
  table: Table<TData>;
  loading?: boolean;
  onRowClick?: (row: TData) => void;
  renderExpandedRow?: (row: TData) => React.ReactNode;
  stickyHeader?: boolean;
  className?: string;
  tableClassName?: string;
  skeletonRows?: number;
}

export default function DataTable<TData>({
  table,
  loading = false,
  onRowClick,
  renderExpandedRow,
  stickyHeader = false,
  className = '',
  tableClassName = '',
  skeletonRows = 5,
}: DataTableProps<TData>) {
  const columnsCount = table.getAllColumns().length;

  return (
    <div className={`overflow-x-auto flex-1 custom-scrollbar ${className}`}>
      <table className={`w-full text-left border-separate border-spacing-y-2 ${tableClassName}`}>
        <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isSortable = header.column.getCanSort();
                const sortingState = header.column.getIsSorted();

                return (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-[0.63rem] font-black uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-500 bg-zinc-50/50 dark:bg-slate-900/50 first:rounded-l-xl last:rounded-r-xl border-b border-zinc-100 dark:border-slate-800"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: isSortable
                            ? 'cursor-pointer select-none flex items-center gap-2 group'
                            : 'flex items-center gap-2',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSortable && (
                          <div className="text-zinc-300 dark:text-slate-600 group-hover:text-zinc-500 transition-colors">
                            {sortingState === 'asc' ? (
                              <ArrowUp size={14} />
                            ) : sortingState === 'desc' ? (
                              <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-zinc-50 dark:divide-slate-800/50">
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="bg-white dark:bg-slate-800/80 shadow-sm border border-zinc-50 dark:border-slate-700/30">
                {Array.from({ length: columnsCount }).map((_, j) => (
                  <td key={`skeleton-cell-${j}`} className="px-6 py-4 border-y border-transparent first:rounded-l-xl last:rounded-r-xl">
                    <Skeleton variant="text" className="w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columnsCount} className="py-20 text-center text-zinc-400 dark:text-slate-500">
                No data available
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row: Row<TData>) => (
              <React.Fragment key={row.id}>
                <tr
                  className={`group transition-all duration-200 relative bg-white dark:bg-slate-800/80 shadow-sm hover:shadow-md border border-zinc-100 dark:border-slate-700/50 cursor-pointer ${
                    row.getIsSelected() ? 'ring-2 ring-olive-500/30' : ''
                  }`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 align-middle border-y border-transparent first:rounded-l-xl last:rounded-r-xl"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {row.getIsExpanded() && renderExpandedRow && (
                  <tr className="bg-zinc-50/50 dark:bg-slate-900/50">
                    <td colSpan={columnsCount} className="p-0">
                      {renderExpandedRow(row.original)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
