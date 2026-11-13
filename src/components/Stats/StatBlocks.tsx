import React from "react";

/** A white card with a heading, used for each block of the stats view. */
export const StatSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <section className="rounded-lg bg-white p-3 shadow-sm">
    <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
    {children}
  </section>
);

/** One headline number, e.g. "Pass completion 78% (14/18)". */
export const StatTile: React.FC<{
  label: string;
  value: string;
  detail?: string;
}> = ({ label, value, detail }) => (
  <div className="rounded-md bg-gray-50 px-2 py-2 text-center">
    <div className="text-xl font-bold text-gray-900 tabular-nums">{value}</div>
    <div className="text-xs leading-tight text-gray-600">{label}</div>
    {detail && (
      <div className="text-xs text-gray-500 tabular-nums">{detail}</div>
    )}
  </div>
);

/** A grid of tiles, two or more per row. */
export const StatTiles: React.FC<{
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}> = ({ children, columns = 2 }) => (
  <div
    className={`grid gap-2 ${
      columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : columns === 3
          ? "grid-cols-3"
          : "grid-cols-2"
    }`}
  >
    {children}
  </div>
);

/** A compact table: first column is the row label, the rest are numbers. */
export const StatTable: React.FC<{
  label: string;
  headers: React.ReactNode[];
  rows: { key: string; label: React.ReactNode; cells: React.ReactNode[] }[];
}> = ({ label, headers, rows }) => (
  <table className="w-full text-sm" aria-label={label}>
    <thead>
      <tr className="border-b border-gray-200 text-xs text-gray-500">
        {headers.map((header, i) => (
          <th
            key={i}
            scope="col"
            className={`py-1 font-medium ${i === 0 ? "text-left" : "text-right"}`}
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.key} className="border-b border-gray-100 last:border-0">
          <th scope="row" className="py-1 text-left font-normal text-gray-700">
            {row.label}
          </th>
          {row.cells.map((cell, i) => (
            <td key={i} className="py-1 text-right text-gray-900 tabular-nums">
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
