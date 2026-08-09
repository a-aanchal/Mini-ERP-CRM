import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Challan, ChallanStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Building,
  Calendar,
  FileText,
  User as UserIcon,
  Printer,
} from 'lucide-react';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockError, setStockError] = useState<{ message: string; available?: number; requested?: number } | null>(null);

  // Dialog states
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { hasRole } = useAuth();

  const fetchChallanDetail = async () => {
    setIsLoading(true);
    setError('');
    setStockError(null);
    try {
      const res = await api.get(`/challans/${id}`);
      if (res.data.success) {
        setChallan(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch challan details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallanDetail();
  }, [id]);

  const handleConfirmChallan = async () => {
    setIsProcessing(true);
    setStockError(null);
    try {
      const res = await api.put(`/challans/${id}/confirm`);
      if (res.data.success) {
        setIsConfirmDialogOpen(false);
        fetchChallanDetail();
      }
    } catch (err: any) {
      setIsConfirmDialogOpen(false);
      if (err.response?.status === 400 && err.response?.data?.available !== undefined) {
        setStockError({
          message: err.response.data.message,
          available: err.response.data.available,
          requested: err.response.data.requested,
        });
      } else {
        setError(err.response?.data?.message || 'Failed to confirm challan');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelChallan = async () => {
    setIsProcessing(true);
    try {
      const res = await api.put(`/challans/${id}/cancel`);
      if (res.data.success) {
        setIsCancelDialogOpen(false);
        fetchChallanDetail();
      }
    } catch (err: any) {
      setIsCancelDialogOpen(false);
      setError(err.response?.data?.message || 'Failed to cancel challan');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchChallanDetail} />;
  if (!challan) return null;

  const grandTotal = challan.items.reduce(
    (sum, item) => sum + item.unitPriceSnapshot * item.quantity,
    0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/challans"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Challans
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Challan
          </button>
        </div>
      </div>

      {stockError && (
        <ErrorMessage
          title="Stock Confirmation Failed (Insufficient Stock)"
          message={stockError.message}
          available={stockError.available}
          requested={stockError.requested}
        />
      )}

      {/* Main Challan Paper Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 print:border-none print:shadow-none">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-slate-900">
                {challan.challanNumber}
              </h1>
              <StatusBadge type="challanStatus" value={challan.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Sales Delivery Challan & Dispatch Slip</p>
          </div>

          <div className="text-right text-xs space-y-1">
            <div className="flex items-center justify-end gap-1.5 text-slate-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date: <span className="font-mono">{new Date(challan.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-slate-600 font-medium">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              Issued By: <span>{challan.createdBy?.name || 'Sales Staff'}</span>
            </div>
          </div>
        </div>

        {/* Customer & Business Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Billed & Dispatched To
            </span>
            <div className="font-bold text-slate-900 text-sm">{challan.customer?.customerName}</div>
            <div className="text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              {challan.customer?.businessName}
            </div>
            <div className="text-slate-500 mt-1">{challan.customer?.address}</div>
          </div>

          <div className="space-y-1 md:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Account Metadata
            </span>
            <div className="text-slate-700">
              Customer Type: <strong>{challan.customer?.customerType}</strong>
            </div>
            <div className="text-slate-700 font-mono">
              GSTIN: <strong>{challan.customer?.gstNumber || 'N/A'}</strong>
            </div>
            <div className="text-slate-700 font-mono">
              Mobile: <strong>{challan.customer?.mobileNumber}</strong>
            </div>
          </div>
        </div>

        {/* Snapshot Items Table */}
        <div>
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Line Items Snapshot (Historical Record)
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Product Name Snapshot</th>
                  <th className="p-3.5">SKU Snapshot</th>
                  <th className="p-3.5 text-right">Unit Price</th>
                  <th className="p-3.5 text-center">Quantity</th>
                  <th className="p-3.5 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {challan.items.map((item, idx) => {
                  const subtotal = item.unitPriceSnapshot * item.quantity;
                  return (
                    <tr key={item.id || idx}>
                      <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {item.productNameSnapshot}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{item.skuSnapshot}</td>
                      <td className="p-3.5 text-right font-mono text-slate-800">
                        ₹{item.unitPriceSnapshot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Box */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-xl shadow-inner">
          <div className="text-xs text-slate-300">
            Total Items: <strong className="text-white">{challan.items.length}</strong> | Total Quantity:{' '}
            <strong className="text-white">{challan.totalQuantity} units</strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Total Order Value
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Action Controls (If status is DRAFT) */}
        {challan.status === ChallanStatus.DRAFT && hasRole('ADMIN', 'SALES') && (
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 print:hidden">
            <button
              type="button"
              onClick={() => setIsCancelDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
            >
              <XCircle className="w-4 h-4" />
              Cancel Challan
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmDialogOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              CONFIRM CHALLAN & DEDUCT STOCK
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmChallan}
        title={`Confirm Sales Challan ${challan.challanNumber}?`}
        message="This action will validate stock availability across all requested products. If valid, stock will be deducted immediately and an OUT stock movement log will be recorded."
        confirmText="Confirm & Deduct Stock"
        isLoading={isProcessing}
      />

      {/* Cancellation Modal */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelChallan}
        title={`Cancel Sales Challan ${challan.challanNumber}?`}
        message="Are you sure you want to mark this draft challan as CANCELLED? No stock will be affected."
        confirmText="Cancel Challan"
        isDanger
        isLoading={isProcessing}
      />
    </div>
  );
};
