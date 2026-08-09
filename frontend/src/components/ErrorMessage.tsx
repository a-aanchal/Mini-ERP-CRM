import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  available?: number;
  requested?: number;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  available,
  requested,
}) => {
  return (
    <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 mb-4 text-rose-800 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm mt-1 text-rose-700">{message}</p>
          {available !== undefined && requested !== undefined && (
            <div className="mt-2 text-xs bg-rose-100/80 p-2 rounded border border-rose-300 font-mono">
              <span>Stock Available: <strong>{available}</strong></span>
              <span className="mx-2">|</span>
              <span>Stock Requested: <strong>{requested}</strong></span>
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
