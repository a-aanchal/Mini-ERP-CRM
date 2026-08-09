import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Customer, Pagination as PaginationType, CustomerType, CustomerStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { SearchInput } from '../components/SearchInput';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Users, Eye, Edit, Phone, Mail, Building } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { hasRole } = useAuth();

  const fetchCustomers = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/customers', { params });
      if (res.data.success) {
        setCustomers(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customer list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Customer CRM Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage wholesale clients, leads, contact details, and follow-up records.
          </p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <Link
            to="/customers/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Customer
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by customer name, mobile, email, or business..."
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Customer Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => fetchCustomers(pagination.page)} />}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <LoadingSpinner size="lg" />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No Customers Found"
            description="No customer records match your filter criteria or search query."
            icon={<Users className="w-8 h-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Customer / Business</th>
                  <th className="p-3.5">Contact Info</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">GST Number</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <Link
                        to={`/customers/${c.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition"
                      >
                        {c.customerName}
                      </Link>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        {c.businessName}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 text-slate-700 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {c.mobileNumber}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {c.email}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge type="customerType" value={c.customerType} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge type="customerStatus" value={c.status} />
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {c.gstNumber || <span className="text-slate-400 italic">N/A</span>}
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <Link
                        to={`/customers/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                      {hasRole('ADMIN', 'SALES') && (
                        <Link
                          to={`/customers/${c.id}/edit`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={fetchCustomers} />
      </div>
    </div>
  );
};
