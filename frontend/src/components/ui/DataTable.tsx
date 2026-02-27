import React from 'react';

interface Column {
  key: string;
  title: string;
  width?: number | string;
  render?: (value: unknown, record: Record<string, unknown>, index: number) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  loading?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ columns, data, loading }) => {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '1px solid #F3F4F6',
                  background: '#F9FAFB',
                  whiteSpace: 'nowrap',
                  width: col.width,
                }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? '#fff' : '#F9FAFB' }}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '12px 14px',
                    fontSize: 13,
                    color: '#374151',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                >
                  {col.render ? col.render(row[col.key], row, rowIdx) : (row[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
