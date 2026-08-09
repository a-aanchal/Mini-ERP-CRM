import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { FormInput } from '../components/FormInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    productName: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minimumStock: 5,
    warehouseLocation: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const res = await api.get(`/products/${id}`);
          if (res.data.success) {
            const p = res.data.data;
            setFormData({
              productName: p.productName || '',
              sku: p.sku || '',
              category: p.category || '',
              unitPrice: p.unitPrice || 0,
              currentStock: p.currentStock || 0,
              minimumStock: p.minimumStock || 5,
              warehouseLocation: p.warehouseLocation || '',
            });
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch product details');
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Frontend Validations
    if (formData.unitPrice < 0) {
      setError('Unit price cannot be negative.');
      return;
    }
    if (formData.currentStock < 0) {
      setError('Current stock cannot be negative.');
      return;
    }
    if (formData.minimumStock < 0) {
      setError('Minimum stock threshold cannot be negative.');
      return;
    }

    setIsLoading(true);

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product record');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEdit) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-xl font-bold text-slate-800">
          {isEdit ? 'Edit Product Item' : 'Add New Product'}
        </h1>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Product Name"
            name="productName"
            required
            value={formData.productName}
            onChange={handleChange}
            placeholder="e.g. Professional Laptop Pro 15"
          />

          <FormInput
            label="SKU Code (Must be Unique)"
            name="sku"
            required
            value={formData.sku}
            onChange={handleChange}
            placeholder="e.g. LAP-PRO-15"
          />

          <FormInput
            label="Category"
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g. Laptops, Accessories, Storage"
          />

          <FormInput
            label="Unit Price (₹)"
            name="unitPrice"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.unitPrice}
            onChange={handleChange}
          />

          <FormInput
            label="Initial Current Stock"
            name="currentStock"
            type="number"
            min="0"
            required
            value={formData.currentStock}
            onChange={handleChange}
            disabled={isEdit} // Stock modifications should be done via Stock Movement for existing products
          />

          <FormInput
            label="Minimum Stock Alert Quantity"
            name="minimumStock"
            type="number"
            min="0"
            required
            value={formData.minimumStock}
            onChange={handleChange}
          />
        </div>

        <FormInput
          label="Warehouse Location / Rack Bin"
          name="warehouseLocation"
          required
          value={formData.warehouseLocation}
          onChange={handleChange}
          placeholder="e.g. Shelf A-12, Bin B-05"
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/products"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
