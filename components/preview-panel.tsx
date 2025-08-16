'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Eye, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewPanelProps {
  previewContent: string;
  loadingPreview: boolean;
  selections: Set<string>;
  selectedFileCount: number;
  copyToClipboard: () => void;
  getButtonText: () => string;
  copySuccess: boolean;
  loading: boolean;
  onClearSelections: () => void;
  renderPreviewContent: (content: string) => React.ReactNode;
}

export function PreviewPanel({
  previewContent,
  loadingPreview,
  selections,
  selectedFileCount,
  copyToClipboard,
  getButtonText,
  copySuccess,
  loading,
  onClearSelections,
  renderPreviewContent,
}: PreviewPanelProps) {
  return (
    <div className="col-span-3 flex flex-col min-h-0">
      <Card className="flex-1 p-6 bg-white border-0 shadow-sm rounded-none flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 h-12">
          <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
            Context Preview
          </h3>
          {previewContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelections}
              className="text-gray-600 hover:text-gray-800"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-gray-50/30 backdrop-blur-sm">
          {loadingPreview ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600">Loading preview...</p>
                <p className="text-xs text-gray-500 mt-1">Processing {selections.size} files</p>
              </div>
            </div>
          ) : selections.size === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Eye size={24} className="text-gray-400" />
                </div>
                <p className="font-medium text-gray-700">
                  Select files to preview
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Choose files from the tree to see their content here
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              {renderPreviewContent(previewContent)}
            </div>
          )}
        </div>

        {/* Copy Button and Stats */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={copyToClipboard}
            disabled={loading || selections.size === 0}
            className="transition-all duration-150"
            style={{
              fontWeight: '500',
              fontSize: '16px',
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%) !important',
              border: '1px solid #2563eb',
              color: '#ffffff !important',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minWidth: '256px',
              cursor: loading || selections.size === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || selections.size === 0 ? '0.5' : '1',
              boxShadow: `
                0 2px 4px rgba(59, 130, 246, 0.3),
                0 1px 2px rgba(59, 130, 246, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                inset 0 -1px 0 rgba(0, 0, 0, 0.1)
              `,
              transform: 'translateY(0px)'
            }}
            onMouseEnter={(e) => {
              if (!loading && selections.size > 0) {
                e.target.style.background = 'linear-gradient(145deg, #2563eb 0%, #1d4ed8 100%)';
                e.target.style.boxShadow = `
                  0 3px 6px rgba(59, 130, 246, 0.4),
                  0 2px 4px rgba(59, 130, 246, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.15)
                `;
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = 'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)';
                e.target.style.boxShadow = `
                  0 2px 4px rgba(59, 130, 246, 0.3),
                  0 1px 2px rgba(59, 130, 246, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `;
                e.target.style.transform = 'translateY(0px)';
              }
            }}
            onMouseDown={(e) => {
              if (!loading && selections.size > 0) {
                e.target.style.background = 'linear-gradient(145deg, #1d4ed8 0%, #1e40af 100%)';
                e.target.style.boxShadow = `
                  0 1px 2px rgba(0, 0, 0, 0.12),
                  inset 0 2px 4px rgba(0, 0, 0, 0.2),
                  inset 0 1px 0 rgba(0, 0, 0, 0.1)
                `;
                e.target.style.transform = 'translateY(1px)';
              }
            }}
            onMouseUp={(e) => {
              if (!loading && selections.size > 0) {
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
          >
            <Copy size={16} /> {getButtonText()}
          </button>

          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">
                {selectedFileCount} file
                {selectedFileCount !== 1 ? 's' : ''}
                {selections.size > selectedFileCount &&
                  ` (+ ${selections.size - selectedFileCount} folder${
                    selections.size - selectedFileCount !== 1 ? 's' : ''
                  })`}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-sm font-medium text-gray-600">
                {previewContent ? previewContent.split('\n').length.toLocaleString() : '0'} lines
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-600">
                ~{previewContent ? Math.ceil(previewContent.length / 4).toLocaleString() : '0'}{' '}
                tokens
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}