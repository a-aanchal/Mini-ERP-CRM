import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { DashboardStats } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { StatusBadge } from '../components/StatusBadge';
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Boxes,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchStats} />;
  if (!stats) return null;

  const { summary, lowStockProducts, recentChallans, recentStockMovements } = stats;

  const cards = [
    {
      title: 'Total Customers',
      value: summary.totalCustomers,
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      link: '/customers',
    },
    {
      title: 'Total Products',
      value: summary.totalProducts,
      icon: Package,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      link: '/products',
    },
    {
      title: 'Low Stock Alert',
      value: summary.lowStockProductsCount,
      icon: AlertTriangle,
      color: summary.lowStockProductsCount > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200',
      link: '/products?lowStock=true',
    },
    {
      title: 'Total Challans',
      value: summary.totalChallans,
      icon: FileText,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      link: '/challans',
    },
    {
      title: 'Draft Challans',
      value: summary.draftChallans,
      icon: Clock,
      color: 'bg-sky-50 text-sky-600 border-sky-200',
      link: '/challans?status=DRAFT',
    },
    {
      title: 'Confirmed Challans',
      value: summary.confirmedChallans,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      link: '/challans?status=CONFIRMED',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Operations Control Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time overview of inventory levels, customer CRM, and sales challan status.
          </p>
        </div>
        <Link
          to="/challans/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <FileText className="w-4 h-4" />
          Create New Challan
        </Link>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              <div className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                {card.title}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Challans */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recent Sales Challans
              </h3>
            </div>
            <Link to="/challans" className="text-xs text-blue-600 hover:underline font-semibold">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentChallans.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No recent challans found.</div>
            ) : (
              recentChallans.map((ch) => (
                <div key={ch.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <Link to={`/challans/${ch.id}`} className="font-bold text-blue-600 hover:underline">
                      {ch.challanNumber}
                    </Link>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {ch.customer?.customerName || 'N/A'} ({ch.totalQuantity} items)
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge type="challanStatus" value={ch.status} />
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Warning Products */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Low Stock Alerts
              </h3>
            </div>
            <Link to="/products?lowStock=true" className="text-xs text-amber-700 hover:underline font-semibold">
              View Products
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-600 font-medium">
                ✅ All inventory levels are above minimum threshold.
              </div>
            ) : (
              lowStockProducts.map((prod) => (
                <div key={prod.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{prod.productName}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {prod.sku}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Stock: {prod.currentStock} / Min: {prod.minimumStock}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">{prod.warehouseLocation}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Stock Movements */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Stock Movements (Audit Trail)
            </h3>
          </div>
          <Link to="/inventory" className="text-xs text-blue-600 hover:underline font-semibold">
            Full Audit Log
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Movement</th>
                <th className="p-3.5">Quantity</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentStockMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No stock movements recorded.
                  </td>
                </tr>
              ) : (
                recentStockMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50">
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(mov.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      {mov.product?.productName || `Product #${mov.productId}`}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge type="movementType" value={mov.movementType} />
                    </td>
                    <td className="p-3.5 font-bold font-mono">
                      {mov.movementType === 'IN' ? `+${mov.quantity}` : `-${mov.quantity}`}
                    </td>
                    <td className="p-3.5 text-slate-600">{mov.reason}</td>
                    <td className="p-3.5 text-slate-500">{mov.createdBy?.name || 'System'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
