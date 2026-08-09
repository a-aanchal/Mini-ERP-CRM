import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Challan, Pagination as PaginationType, ChallanStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { SearchInput } from '../components/SearchInput';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, FileText, Eye, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const ChallansPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status') as ChallanStatus | null;

  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(statusParam || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { hasRole } = useAuth();

  const fetchChallans = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/challans', { params });
      if (res.data.success) {
        setChallans(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sales challans list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChallans(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Sales Challan Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, manage, and confirm sales challans with automatic inventory stock updates.
          </p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <Link
            to="/challans/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Sales Challan
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by challan number or customer name..."
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Challan Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => fetchChallans(pagination.page)} />}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <LoadingSpinner size="lg" />
        ) : challans.length === 0 ? (
          <EmptyState
            title="No Sales Challans Found"
            description="No sales challans recorded match your search or status query."
            icon={<FileText className="w-8 h-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Challan Number</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Total Quantity</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5">Created By</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <Link
                        to={`/challans/${ch.id}`}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        {ch.challanNumber}
                      </Link>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">
                        {ch.customer?.customerName || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ch.customer?.businessName}
                      </div>
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-800">
                      {ch.totalQuantity} items
                    </td>
                    <td className="p-3.5">
                      <StatusBadge type="challanStatus" value={ch.status} />
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {ch.createdBy?.name || 'Staff'}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/challans/${ch.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Challan
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={fetchChallans} />
      </div>
    </div>
  );
};
