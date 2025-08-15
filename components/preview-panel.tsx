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
      <Card className="flex-1 p-6 bg-white border-0 shadow-lg rounded-none flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 h-12">
          <h3 className="text-lg font-semibold text-gray-900">
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

        <div className="flex-1 overflow-auto rounded-lg border border-blue-200/60 bg-blue-50/80 backdrop-blur-sm">
          {loadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600">Loading preview...</p>
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
          <Button
            onClick={copyToClipboard}
            disabled={loading || selections.size === 0}
            className={cn(
              'font-semibold transition-all duration-200',
              copySuccess && 'bg-blue-600 hover:bg-blue-700',
              'min-w-64',
            )}
          >
            <Copy size={16} /> {getButtonText()}
          </Button>

          {previewContent && (
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
                  {previewContent.split('\n').length.toLocaleString()} lines
                </span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-600">
                  ~{Math.ceil(previewContent.length / 4).toLocaleString()}{' '}
                  tokens
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

interface WelcomePanelProps {}

export function WelcomePanel({}: WelcomePanelProps) {
  return (
    <div className="col-span-3 flex flex-col min-h-0">
      <Card className="flex-1 p-6 bg-white border-0 shadow-lg rounded-none flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 h-12">
          <h3 className="text-lg font-semibold text-gray-900">
            Context Preview
          </h3>
        </div>

        <div className="flex-1 overflow-auto rounded-lg border border-blue-200/60 bg-blue-50/80 backdrop-blur-sm">
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
        </div>

        {/* Copy Button and Stats - Disabled State */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            disabled={true}
            className="font-semibold transition-all duration-200 min-w-64"
          >
            <Copy size={16} /> Copy
          </Button>

          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">
                0 files
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-sm font-medium text-gray-600">
                0 lines
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-600">
                ~0 tokens
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}