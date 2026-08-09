import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Customer, FollowUp } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { FormInput } from '../components/FormInput';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  Plus,
  MessageSquare,
  FileText,
  Clock,
  Edit,
} from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Follow-up modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const { hasRole } = useAuth();

  const fetchCustomerDetails = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setCustomer(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customer details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      await api.post(`/customers/${id}/followups`, {
        notes: noteContent,
        followUpDate: followUpDate || null,
      });
      setNoteContent('');
      setFollowUpDate('');
      setIsModalOpen(false);
      fetchCustomerDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add follow-up note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchCustomerDetails} />;
  if (!customer) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Link>
        {hasRole('ADMIN', 'SALES') && (
          <Link
            to={`/customers/${customer.id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </Link>
        )}
      </div>

      {/* Customer Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{customer.customerName}</h1>
              <StatusBadge type="customerStatus" value={customer.status} />
              <StatusBadge type="customerType" value={customer.customerType} />
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              {customer.businessName}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Next Follow-Up
              </div>
              <div className="text-xs font-bold text-slate-800">
                {customer.followUpDate
                  ? new Date(customer.followUpDate).toLocaleDateString()
                  : 'No scheduled follow-up'}
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Mobile Contact</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 font-mono">
              <Phone className="w-3.5 h-3.5 text-blue-500" />
              {customer.mobileNumber}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Email Address</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              {customer.email}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">GST Number</span>
            <div className="font-bold text-slate-800 font-mono">
              {customer.gstNumber || 'Not Provided'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Account Created</span>
            <div className="font-bold text-slate-800">
              {new Date(customer.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Address
          </span>
          <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
            {customer.address}
          </p>
        </div>

        {customer.notes && (
          <div>
            <span className="text-xs font-bold text-slate-700 mb-1 block">Internal Account Notes</span>
            <p className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
              {customer.notes}
            </p>
          </div>
        )}
      </div>

      {/* Follow-up Notes Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">CRM Follow-up Notes & Interactions</h3>
          </div>
          {hasRole('ADMIN', 'SALES') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Follow-up Note
            </button>
          )}
        </div>

        {customer.followUps && customer.followUps.length > 0 ? (
          <div className="space-y-3">
            {customer.followUps.map((fu: FollowUp) => (
              <div key={fu.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="font-semibold text-slate-800">{fu.createdBy?.name || 'Staff'}</span>
                  <span className="font-mono text-[11px]">{new Date(fu.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-line">{fu.notes}</p>
                {fu.followUpDate && (
                  <div className="mt-2 text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Next Followup Scheduled: {new Date(fu.followUpDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center italic">
            No follow-up records added yet for this customer.
          </p>
        )}
      </div>

      {/* Add Follow-Up Note Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Follow-up Note">
        <form onSubmit={handleAddFollowUp} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Follow-up Notes *</label>
            <textarea
              required
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Enter interaction details, customer call outcome, or agreed next steps..."
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <FormInput
            label="Next Scheduled Follow-up Date (Optional)"
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
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
              disabled={isSubmittingNote}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
            >
              {isSubmittingNote ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
