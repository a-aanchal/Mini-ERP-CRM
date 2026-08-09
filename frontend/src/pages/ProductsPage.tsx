import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Product, Pagination as PaginationType } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { SearchInput } from '../components/SearchInput';
import { Pagination } from '../components/Pagination';
import { Plus, Package, Edit, AlertTriangle, Boxes, CheckCircle2 } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const lowStockParam = searchParams.get('lowStock') === 'true';

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(lowStockParam);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { hasRole } = useAuth();

  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (lowStockFilter) params.lowStock = 'true';

      const res = await api.get('/products', { params });
      if (res.data.success) {
        setProducts(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, lowStockFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Product & Inventory Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage wholesale product listings, pricing, warehouse locations, and stock alerts.
          </p>
        </div>
        {hasRole('ADMIN', 'WAREHOUSE') && (
          <Link
            to="/products/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by product name, SKU, or category..."
        />

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => {
                setLowStockFilter(e.target.checked);
                setSearchParams(e.target.checked ? { lowStock: 'true' } : {});
              }}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Show Low Stock Only
          </label>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => fetchProducts(pagination.page)} />}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <LoadingSpinner size="lg" />
        ) : products.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="No product inventory items match your search or filter parameters."
            icon={<Package className="w-8 h-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">SKU / Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Unit Price</th>
                  <th className="p-3.5">Current Stock</th>
                  <th className="p-3.5">Warehouse Location</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isLowStock = p.currentStock <= p.minimumStock;
                  const isOutOfStock = p.currentStock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{p.productName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          SKU: {p.sku}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-900">
                        ₹{p.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold font-mono text-sm ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : isLowStock
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {p.currentStock} units
                          </span>
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              OUT OF STOCK
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              LOW STOCK (Min: {p.minimumStock})
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {p.warehouseLocation}
                      </td>
                      <td className="p-3.5 text-right">
                        {hasRole('ADMIN', 'WAREHOUSE') && (
                          <Link
                            to={`/products/${p.id}/edit`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={fetchProducts} />
      </div>
    </div>
  );
};
