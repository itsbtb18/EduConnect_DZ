/**
 * Export utilities for CSV and PDF generation.
 * Used across grades, attendance, and financial pages.
 */

/** Convert array of objects to CSV string and trigger download */
export function exportToCSV(
  data: Record<string, unknown>[],
  columns: { key: string; title: string }[],
  filename: string,
): void {
  if (!data.length) return;

  const header = columns.map((c) => `"${c.title}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        if (val == null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(','),
  );

  const csv = [header, ...rows].join('\n');
  const BOM = '\uFEFF'; // UTF-8 BOM for proper encoding in Excel
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/** Generate a simple PDF table and trigger download */
export function exportToPDF(
  data: Record<string, unknown>[],
  columns: { key: string; title: string; width?: number }[],
  filename: string,
  title?: string,
): void {
  if (!data.length) return;

  // Build HTML table for print-to-PDF
  let html = `
<!DOCTYPE html>
<html dir="ltr" lang="fr">
<head>
  <meta charset="utf-8">
  <title>${title || filename}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1F2937; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .meta { color: #6B7280; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #F3F4F6; font-weight: 700; text-transform: uppercase; font-size: 10px;
         letter-spacing: 0.5px; color: #6B7280; }
    th, td { padding: 8px 12px; border: 1px solid #E5E7EB; text-align: left; }
    tr:nth-child(even) { background: #F9FAFB; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${title || filename}</h1>
  <div class="meta">Exporté le ${new Date().toLocaleDateString('fr-FR')} — ${data.length} enregistrements</div>
  <table>
    <thead><tr>${columns.map((c) => `<th>${c.title}</th>`).join('')}</tr></thead>
    <tbody>`;

  for (const row of data) {
    html += '<tr>';
    for (const col of columns) {
      const val = row[col.key];
      html += `<td>${val != null ? String(val) : '—'}</td>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table></body></html>';

  // Open in new window for print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Small delay to let styles load
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }
}

/** Helper to download a blob as a file */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
