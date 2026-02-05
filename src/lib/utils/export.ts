import * as XLSX from 'xlsx';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  // 데이터를 행 배열로 변환
  const headers = columns.map(col => col.header);
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      return value !== undefined && value !== null ? String(value) : '';
    })
  );

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 컬럼 너비 설정
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

  // 워크북 생성
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // 파일 다운로드
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  const headers = columns.map(col => col.header);
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      // CSV 이스케이프 처리
      const strValue = value !== undefined && value !== null ? String(value) : '';
      return strValue.includes(',') || strValue.includes('"')
        ? `"${strValue.replace(/"/g, '""')}"`
        : strValue;
    })
  );

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  // BOM 추가 (한글 지원)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
