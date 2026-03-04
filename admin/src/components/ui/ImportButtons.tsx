/**
 * ImportButtons — Reusable import Excel/CSV buttons with "Bientôt" badge.
 *
 * Shows:
 * - "Importer Excel" button (green border-dashed)
 * - "Importer CSV" button (blue border-dashed)
 * - "📄 Télécharger le template" button (downloads an .xlsx template)
 *
 * On click of import buttons → toast message "disponible prochainement".
 * Template button → generates and downloads a real .xlsx file via SheetJS.
 */
import React, { useCallback } from 'react';
import { Button, Tag, message } from 'antd';
import {
  FileExcelOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';

export type TemplateType = 'teachers' | 'students';

const TEMPLATE_COLUMNS: Record<TemplateType, string[]> = {
  teachers: ['Nom', 'Prénom', 'Téléphone', 'Email', 'Sections', 'Matières', 'Classes'],
  students: ['Nom', 'Prénom', 'Date de naissance', 'Téléphone parent', 'Classe', 'N° inscription'],
};

const TEMPLATE_FILENAMES: Record<TemplateType, string> = {
  teachers: 'template_enseignants.xlsx',
  students: 'template_eleves.xlsx',
};

interface ImportButtonsProps {
  /** Which template to generate: 'teachers' or 'students' */
  templateType: TemplateType;
  /** Extra style for the wrapper div */
  style?: React.CSSProperties;
}

const ImportButtons: React.FC<ImportButtonsProps> = ({ templateType, style }) => {

  const handleImportClick = useCallback(() => {
    message.info({
      content: "📥 L'import en masse sera disponible prochainement. Vous pouvez télécharger le template depuis cette page.",
      duration: 5,
    });
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    const columns = TEMPLATE_COLUMNS[templateType];
    const ws = XLSX.utils.aoa_to_sheet([columns]);

    // Set column widths for readability
    ws['!cols'] = columns.map((col) => ({ wch: Math.max(col.length + 4, 18) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, templateType === 'teachers' ? 'Enseignants' : 'Élèves');
    XLSX.writeFile(wb, TEMPLATE_FILENAMES[templateType]);

    message.success('📄 Template téléchargé !');
  }, [templateType]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', ...style }}>
      <Button
        icon={<FileExcelOutlined />}
        style={{ borderColor: '#52c41a', color: '#52c41a', borderStyle: 'dashed' }}
        onClick={handleImportClick}
      >
        Importer Excel
        <Tag color="orange" style={{ marginLeft: 8, fontSize: 10, lineHeight: '16px' }}>Bientôt</Tag>
      </Button>

      <Button
        icon={<UploadOutlined />}
        style={{ borderColor: '#1677ff', color: '#1677ff', borderStyle: 'dashed' }}
        onClick={handleImportClick}
      >
        Importer CSV
        <Tag color="orange" style={{ marginLeft: 8, fontSize: 10, lineHeight: '16px' }}>Bientôt</Tag>
      </Button>

      <Button
        icon={<DownloadOutlined />}
        type="link"
        onClick={handleDownloadTemplate}
      >
        📄 Télécharger le template
      </Button>
    </div>
  );
};

export default ImportButtons;
