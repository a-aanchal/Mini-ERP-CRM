import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { FormInput } from '../components/FormInput';
import { SelectInput } from '../components/SelectInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';

export const CustomerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'RETAIL',
    address: '',
    status: 'LEAD',
    followUpDate: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      const fetchCustomer = async () => {
        setIsLoading(true);
        try {
          const res = await api.get(`/customers/${id}`);
          if (res.data.success) {
            const c = res.data.data;
            setFormData({
              customerName: c.customerName || '',
              mobileNumber: c.mobileNumber || '',
              email: c.email || '',
              businessName: c.businessName || '',
              gstNumber: c.gstNumber || '',
              customerType: c.customerType || 'RETAIL',
              address: c.address || '',
              status: c.status || 'LEAD',
              followUpDate: c.followUpDate ? c.followUpDate.split('T')[0] : '',
              notes: c.notes || '',
            });
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch customer data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isEdit) {
        await api.put(`/customers/${id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      navigate('/customers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEdit) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer List
        </Link>
        <h1 className="text-xl font-bold text-slate-800">
          {isEdit ? 'Edit Customer Record' : 'Add New Customer'}
        </h1>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Customer Name"
            name="customerName"
            required
            value={formData.customerName}
            onChange={handleChange}
            placeholder="e.g. John Doe"
          />

          <FormInput
            label="Business / Company Name"
            name="businessName"
            required
            value={formData.businessName}
            onChange={handleChange}
            placeholder="e.g. ABC Traders Ltd"
          />

          <FormInput
            label="Mobile Number"
            name="mobileNumber"
            type="tel"
            required
            value={formData.mobileNumber}
            onChange={handleChange}
            placeholder="10-digit mobile number"
          />

          <FormInput
            label="Email Address"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
          />

          <SelectInput
            label="Customer Type"
            name="customerType"
            value={formData.customerType}
            onChange={handleChange}
            options={[
              { label: 'Retail', value: 'RETAIL' },
              { label: 'Wholesale', value: 'WHOLESALE' },
              { label: 'Distributor', value: 'DISTRIBUTOR' },
            ]}
          />

          <SelectInput
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { label: 'Lead', value: 'LEAD' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ]}
          />

          <FormInput
            label="GST Number (Optional)"
            name="gstNumber"
            value={formData.gstNumber}
            onChange={handleChange}
            placeholder="e.g. 27AAAAA0000A1Z5"
          />

          <FormInput
            label="Next Follow-Up Date"
            name="followUpDate"
            type="date"
            value={formData.followUpDate}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Full Address *</label>
          <textarea
            name="address"
            required
            rows={2}
            value={formData.address}
            onChange={handleChange}
            placeholder="Full office / shipping address..."
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Internal Notes</label>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add relevant business notes, payment terms, or preferences..."
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/customers"
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
            {isLoading ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};
