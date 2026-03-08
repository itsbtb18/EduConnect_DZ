/**
 * Tests for the useExport utilities — CSV generation logic
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We replicate the CSV-generation logic (pure string building) to test it
// without DOM dependencies. The actual exportToCSV calls downloadBlob which
// needs a browser — we test the string-building separately.

function buildCSV(
  data: Record<string, unknown>[],
  columns: { key: string; title: string }[],
): string {
  if (!data.length) return '';
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
  return [header, ...rows].join('\n');
}

describe('CSV export logic', () => {
  it('builds header row from column titles', () => {
    const csv = buildCSV(
      [{ name: 'Ahmed', grade: 15 }],
      [
        { key: 'name', title: 'Nom' },
        { key: 'grade', title: 'Note' },
      ],
    );
    const lines = csv.split('\n');
    expect(lines[0]).toBe('"Nom","Note"');
  });

  it('builds data rows with proper quoting', () => {
    const csv = buildCSV(
      [
        { name: 'Ali', grade: 18 },
        { name: 'Fatima', grade: 16.5 },
      ],
      [
        { key: 'name', title: 'Nom' },
        { key: 'grade', title: 'Note' },
      ],
    );
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + 2 data rows
    expect(lines[1]).toBe('"Ali","18"');
    expect(lines[2]).toBe('"Fatima","16.5"');
  });

  it('handles null/undefined values', () => {
    const csv = buildCSV(
      [{ name: 'Test', grade: null, comment: undefined }],
      [
        { key: 'name', title: 'Nom' },
        { key: 'grade', title: 'Note' },
        { key: 'comment', title: 'Remarque' },
      ],
    );
    const lines = csv.split('\n');
    expect(lines[1]).toBe('"Test","",""');
  });

  it('escapes double quotes in values', () => {
    const csv = buildCSV(
      [{ name: 'Said "le prof"' }],
      [{ key: 'name', title: 'Nom' }],
    );
    const lines = csv.split('\n');
    expect(lines[1]).toBe('"Said ""le prof"""');
  });

  it('returns empty string for empty data', () => {
    const csv = buildCSV([], [{ key: 'name', title: 'Nom' }]);
    expect(csv).toBe('');
  });

  it('handles missing keys in data objects', () => {
    const csv = buildCSV(
      [{ name: 'Karim' }],
      [
        { key: 'name', title: 'Nom' },
        { key: 'absent_key', title: 'Manquant' },
      ],
    );
    const lines = csv.split('\n');
    expect(lines[1]).toBe('"Karim",""');
  });
});

describe('exportToCSV (with mocked Blob)', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('creates a Blob with CSV content', async () => {
    // Import the actual module
    const { exportToCSV } = await import('../hooks/useExport');

    // Mock the anchor element for download
    const mockClick = vi.fn();
    const mockAnchor = { href: '', download: '', click: mockClick, style: {} };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockReturnValue(mockAnchor as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockReturnValue(mockAnchor as unknown as Node);

    exportToCSV(
      [{ name: 'Test', value: 10 }],
      [
        { key: 'name', title: 'Name' },
        { key: 'value', title: 'Value' },
      ],
      'test_export',
    );

    expect(mockClick).toHaveBeenCalledOnce();
    expect(mockAnchor.download).toBe('test_export.csv');
  });
});
