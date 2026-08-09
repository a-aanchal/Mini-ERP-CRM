import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Customer, Product, ChallanStatus } from '../types';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SelectInput } from '../components/SelectInput';
import { FormInput } from '../components/FormInput';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface SelectedItem {
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  availableStock: number;
  quantity: number;
}

export const ChallanFormPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<SelectedItem[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stockError, setStockError] = useState<{ message: string; available?: number; requested?: number } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const initForm = async () => {
      setIsLoadingData(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/products?limit=100'),
        ]);

        if (custRes.data.success) setCustomers(custRes.data.data);
        if (prodRes.data.success) setProducts(prodRes.data.data);
      } catch (err: any) {
        setError('Failed to load customers or products for challan creation.');
      } finally {
        setIsLoadingData(false);
      }
    };

    initForm();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    const firstProduct = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: firstProduct.id,
        productName: firstProduct.productName,
        sku: firstProduct.sku,
        unitPrice: firstProduct.unitPrice,
        availableStock: firstProduct.currentStock,
        quantity: 1,
      },
    ]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === 'productId') {
        const selectedProd = products.find((p) => p.id === parseInt(value, 10));
        if (selectedProd) {
          updated[index] = {
            ...updated[index],
            productId: selectedProd.id,
            productName: selectedProd.productName,
            sku: selectedProd.sku,
            unitPrice: selectedProd.unitPrice,
            availableStock: selectedProd.currentStock,
          };
        }
      } else if (field === 'quantity') {
        updated[index].quantity = Math.max(1, parseInt(value, 10) || 1);
      }
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const calculateTotalQuantity = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSubmit = async (targetStatus: ChallanStatus) => {
    setError('');
    setStockError(null);

    if (!selectedCustomerId) {
      setError('Please select a customer for this sales challan.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one product line item to the challan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerId: parseInt(selectedCustomerId, 10),
        status: targetStatus,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const res = await api.post('/challans', payload);

      if (res.data.success) {
        navigate(`/challans/${res.data.data.id}`);
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.available !== undefined) {
        setStockError({
          message: err.response.data.message,
          available: err.response.data.available,
          requested: err.response.data.requested,
        });
      } else {
        setError(err.response?.data?.message || 'Failed to create sales challan');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/challans"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Challan List
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Create New Sales Challan</h1>
      </div>

      {error && <ErrorMessage message={error} />}
      {stockError && (
        <ErrorMessage
          title="Stock Validation Error (Transaction Aborted)"
          message={stockError.message}
          available={stockError.available}
          requested={stockError.requested}
        />
      )}

      {/* Main Form Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Customer Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <SelectInput
            label="Select Wholesale Customer"
            required
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            options={[
              { label: '-- Select Customer --', value: '' },
              ...customers.map((c) => ({
                label: `${c.customerName} (${c.businessName}) - ${c.customerType}`,
                value: c.id,
              })),
            ]}
          />

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Auto Challan Number</span>
            <span className="text-sm font-bold font-mono text-blue-600">
              CH-AUTO (Generated on save)
            </span>
          </div>
        </div>

        {/* Product Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Line Items (Product Snapshots)
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Line Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
              No products added to this challan yet. Click <strong>"Add Line Item"</strong> above.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Product Name / SKU</th>
                    <th className="p-3">Unit Price Snapshot</th>
                    <th className="p-3">Avail. Stock</th>
                    <th className="p-3 w-28">Quantity</th>
                    <th className="p-3 text-right">Line Subtotal</th>
                    <th className="p-3 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const lineSubtotal = item.unitPrice * item.quantity;
                    const isShort = item.availableStock < item.quantity;

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.productName} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-700">
                          ₹{item.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 font-mono">
                          <span
                            className={`font-bold ${
                              isShort ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200' : 'text-slate-700'
                            }`}
                          >
                            {item.availableStock} units
                          </span>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ₹{lineSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Challan Summary */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            Total Line Items: <strong className="text-slate-800">{items.length}</strong> | Total Quantity:{' '}
            <strong className="text-slate-800">{calculateTotalQuantity()} units</strong>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-bold block">Grand Total Value</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              ₹{calculateGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleSubmit(ChallanStatus.DRAFT)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Save className="w-4 h-4 text-slate-500" />
            {isSubmitting ? 'Saving...' : 'Save as DRAFT (No Stock Reduction)'}
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(ChallanStatus.CONFIRMED)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Validating & Confirming...' : 'CONFIRM Challan (Deduct Stock)'}
          </button>
        </div>
      </div>
    </div>
  );
};
