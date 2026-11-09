'use client';

import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { triggerCsvDownload } from '@/lib/laporan/csv';

export interface ExportButtonsProps {
  getCsvData: () => { content: string; filename: string };
  disabled?: boolean;
}

export function ExportButtons({ getCsvData, disabled }: ExportButtonsProps) {
  const handleDownloadCsv = () => {
    const { content, filename } = getCsvData();
    triggerCsvDownload(content, filename);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={handleDownloadCsv}
        className="gap-1.5"
      >
        <Download className="h-4 w-4" />
        <span>Unduh CSV</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={handlePrint}
        className="gap-1.5"
      >
        <Printer className="h-4 w-4" />
        <span>Cetak / PDF</span>
      </Button>
    </div>
  );
}

