import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StockMovement, Product, Pagination as PaginationType, MovementType } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';
import { SelectInput } from '../components/SelectInput';
import { Boxes, Plus, ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state for recording manual stock movement
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    productId: '',
    movementType: 'IN' as MovementType,
    quantity: 1,
    reason: '',
  });
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hasRole } = useAuth();

  const fetchMovements = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      if (selectedProductId) params.productId = selectedProductId;

      const res = await api.get('/stock/movements', { params });
      if (res.data.success) {
        setMovements(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stock movement log');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductsList = async () => {
    try {
      const res = await api.get('/products?limit=100');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load products for dropdown:', err);
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, []);

  useEffect(() => {
    fetchMovements(1);
  }, [typeFilter, selectedProductId]);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!modalForm.productId) {
      setModalError('Please select a product.');
      return;
    }
    if (modalForm.quantity <= 0) {
      setModalError('Quantity must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/stock/movements', {
        productId: parseInt(modalForm.productId, 10),
        movementType: modalForm.movementType,
        quantity: modalForm.quantity,
        reason: modalForm.reason,
      });

      if (res.data.success) {
        setIsModalOpen(false);
        setModalForm({ productId: '', movementType: 'IN', quantity: 1, reason: '' });
        fetchMovements(1);
        fetchProductsList();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to record stock movement';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Stock Movement Audit Log</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time inward and outward stock movements with complete transactional history.
          </p>
        </div>
        {hasRole('ADMIN', 'WAREHOUSE') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Record Stock Movement
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.productName} ({p.sku})
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Movement Types</option>
            <option value="IN">IN (Stock Added)</option>
            <option value="OUT">OUT (Stock Removed)</option>
          </select>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => fetchMovements(pagination.page)} />}

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <LoadingSpinner size="lg" />
        ) : movements.length === 0 ? (
          <EmptyState
            title="No Stock Movements Found"
            description="No inventory movement records match your filter criteria."
            icon={<History className="w-8 h-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Product SKU / Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Quantity Changed</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono text-slate-500">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">
                        {m.product?.productName || `Product #${m.productId}`}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        SKU: {m.product?.sku}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge type="movementType" value={m.movementType} />
                    </td>
                    <td className="p-3.5 font-bold font-mono">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          m.movementType === 'IN' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {m.movementType === 'IN' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                        {m.movementType === 'IN' ? `+${m.quantity}` : `-${m.quantity}`} units
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{m.reason}</td>
                    <td className="p-3.5 text-slate-500">{m.createdBy?.name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={fetchMovements} />
      </div>

      {/* Record Stock Movement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Stock Movement"
      >
        {modalError && <ErrorMessage message={modalError} />}

        <form onSubmit={handleRecordMovement} className="space-y-4">
          <SelectInput
            label="Select Product"
            required
            value={modalForm.productId}
            onChange={(e) => setModalForm((prev) => ({ ...prev, productId: e.target.value }))}
            options={[
              { label: '-- Select Product --', value: '' },
              ...products.map((p) => ({
                label: `${p.productName} (Current Stock: ${p.currentStock})`,
                value: p.id,
              })),
            ]}
          />

          <SelectInput
            label="Movement Type"
            required
            value={modalForm.movementType}
            onChange={(e) =>
              setModalForm((prev) => ({ ...prev, movementType: e.target.value as MovementType }))
            }
            options={[
              { label: 'IN (Add Stock to Inventory)', value: 'IN' },
              { label: 'OUT (Remove Stock from Inventory)', value: 'OUT' },
            ]}
          />

          <FormInput
            label="Quantity"
            type="number"
            min="1"
            required
            value={modalForm.quantity}
            onChange={(e) =>
              setModalForm((prev) => ({ ...prev, quantity: parseInt(e.target.value, 10) || 1 }))
            }
          />

          <FormInput
            label="Reason for Stock Adjustment"
            required
            value={modalForm.reason}
            onChange={(e) => setModalForm((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="e.g. New stock shipment, Damage write-off, Physical audit correction"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
            >
              {isSubmitting ? 'Recording...' : 'Submit Movement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
