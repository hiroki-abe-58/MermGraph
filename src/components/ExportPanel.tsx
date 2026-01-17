import { useState, useCallback, useEffect } from 'react';
import './ExportPanel.css';

interface ExportPanelProps {
  code: string;
}

const BACKEND_URL = 'http://localhost:3001';

type ExportFormatId = 'png' | 'svg' | 'pdf' | 'mmd';

interface ExportOption {
  id: ExportFormatId;
  label: string;
  description: string;
  icon: string;
  fileExtension: string;
  requiresBackend: boolean;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'png',
    label: 'PNG',
    description: '透過背景の画像形式',
    icon: 'image',
    fileExtension: 'png',
    requiresBackend: true,
  },
  {
    id: 'svg',
    label: 'SVG',
    description: '拡大しても劣化しないベクター',
    icon: 'polyline',
    fileExtension: 'svg',
    requiresBackend: true,
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: '共有しやすいドキュメント',
    icon: 'picture_as_pdf',
    fileExtension: 'pdf',
    requiresBackend: true,
  },
  {
    id: 'mmd',
    label: 'Mermaid (MMD)',
    description: 'テキスト形式のソース',
    icon: 'code',
    fileExtension: 'mmd',
    requiresBackend: false,
  },
];

function ExportPanel({ code }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatId>('png');

  const triggerDownload = useCallback((url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const exportDiagram = useCallback(async (format: ExportFormatId) => {
    if (!code.trim() || isExporting) return;

    setIsExporting(true);
    try {
      const option = EXPORT_OPTIONS.find((item) => item.id === format);
      if (!option) {
        throw new Error('未対応の形式です');
      }

      if (!option.requiresBackend) {
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `diagram.${option.fileExtension}`);
        return true;
      }

      const response = await fetch(`${BACKEND_URL}/api/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, format }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `diagram.${option.fileExtension}`);
      return true;
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsExporting(false);
    }
  }, [code, isExporting, triggerDownload]);

  const openModal = useCallback(() => {
    if (!code.trim()) return;
    setIsModalOpen(true);
    setIsClosing(false);
  }, [code]);

  const closeModal = useCallback(() => {
    if (!isModalOpen || isClosing) return;
    setIsClosing(true);
  }, [isClosing, isModalOpen]);

  const handleConfirmExport = useCallback(async () => {
    const success = await exportDiagram(selectedFormat);
    if (success) {
      closeModal();
    }
  }, [closeModal, exportDiagram, selectedFormat]);

  useEffect(() => {
    if (!isClosing) return;
    const timer = window.setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [isClosing]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal, isModalOpen]);

  return (
    <div className="export-panel">
      <button
        className="btn btn-primary"
        onClick={openModal}
        disabled={isExporting || !code.trim()}
        title="Export options"
      >
        <span className="material-icons">download</span>
        Export
      </button>
      {isModalOpen && (
        <div
          className={`modal-overlay ${isClosing ? 'closing' : 'open'}`}
          onClick={closeModal}
        >
          <div
            className={`modal ${isClosing ? 'closing' : 'open'}`}
            role="dialog"
            aria-modal="true"
            aria-label="Export"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-slot" />
              <button
                className="modal-icon-button"
                onClick={closeModal}
                title="閉じる"
                type="button"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-title">Export</div>
            <div className="modal-body">
              <div className="export-options">
                {EXPORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`export-option ${selectedFormat === option.id ? 'selected' : ''}`}
                    onClick={() => setSelectedFormat(option.id)}
                  >
                    <span className="material-icons">{option.icon}</span>
                    <div className="export-option-text">
                      <span className="export-option-label">{option.label}</span>
                      <span className="export-option-description">{option.description}</span>
                    </div>
                    <span className="material-icons export-option-check">
                      {selectedFormat === option.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary btn-block"
                onClick={handleConfirmExport}
                disabled={isExporting || !code.trim()}
                type="button"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportPanel;
