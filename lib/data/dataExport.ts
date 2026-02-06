/**
 * BN-Aura Data Import/Export Tools
 */

export interface ExportConfig {
  format: 'json' | 'csv' | 'xlsx';
  includeHeaders: boolean;
  dateRange?: { start: Date; end: Date };
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

// Export customers to CSV
export function exportCustomersToCSV(customers: Record<string, unknown>[]): string {
  if (customers.length === 0) return '';

  const headers = ['ID', 'Name', 'Email', 'Phone', 'Skin Type', 'Created At'];
  const rows = customers.map(c => [
    c.id,
    c.name,
    c.email,
    c.phone || '',
    c.skinType || '',
    c.createdAt,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// Export analysis data
export function exportAnalysisData(analyses: Record<string, unknown>[]): string {
  const headers = ['ID', 'Customer', 'Date', 'Score', 'Spots', 'Wrinkles', 'Texture', 'Pores'];
  const rows = analyses.map(a => {
    const metrics = a.metrics as Record<string, number> || {};
    return [
      a.id,
      a.customerName,
      a.date,
      a.overallScore,
      metrics.spots || 0,
      metrics.wrinkles || 0,
      metrics.texture || 0,
      metrics.pores || 0,
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// Parse CSV import
export function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i]?.trim() || '';
    });
    return obj;
  });
}

// Import customers from CSV
export async function importCustomers(
  data: Record<string, string>[],
  clinicId: string
): Promise<ImportResult> {
  const result: ImportResult = { success: true, imported: 0, failed: 0, errors: [] };

  for (const row of data) {
    try {
      // Validate required fields
      if (!row.name || !row.email) {
        result.failed++;
        result.errors.push(`Missing name or email for row`);
        continue;
      }

      // In production, save to database
      console.log(`[Import] Customer: ${row.name} (${row.email})`);
      result.imported++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Error importing ${row.name}: ${error}`);
    }
  }

  result.success = result.failed === 0;
  return result;
}

// Generate downloadable file
export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Export to JSON
export function exportToJSON(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export default {
  exportCustomersToCSV,
  exportAnalysisData,
  parseCSV,
  importCustomers,
  downloadFile,
  exportToJSON,
};
