import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Building2, ArrowRight, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { FormInput } from '../components/FormInput';
import { SelectInput } from '../components/SelectInput';
import { ErrorMessage } from '../components/ErrorMessage';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SALES');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        const res = await api.post('/auth/register', { name, email, password, role });
        if (res.data.success) {
          login(res.data.data.token, res.data.data.user);
          navigate(from, { replace: true });
        }
      } else {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.success) {
          login(res.data.data.token, res.data.data.user);
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      const validationError = err.response?.data?.errors?.[0]?.message;
      const msg = serverMessage || validationError || 'Connecting to server... (Render free backend is waking up, please try again in a few seconds)';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (roleEmail: string, rolePass: string) => {
    setIsRegister(false);
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800 animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Mini ERP + CRM</h1>
          <p className="text-xs text-blue-100 mt-1">Wholesale & Distribution Portal</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            className={`flex-1 py-3 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition ${
              !isRegister
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className={`flex-1 py-3 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition ${
              isRegister
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && <ErrorMessage title="Authentication Notice" message={error} />}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <FormInput
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anchal Kumari"
              />
            )}

            <FormInput
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />

            <FormInput
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? 'Min 6 characters' : '••••••••'}
            />

            {isRegister && (
              <SelectInput
                label="Assign Account Role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { label: 'Admin (Full Access)', value: 'ADMIN' },
                  { label: 'Sales (CRM & Challans)', value: 'SALES' },
                  { label: 'Warehouse (Stock & Catalog)', value: 'WAREHOUSE' },
                  { label: 'Accounts (Reports & Orders)', value: 'ACCOUNTS' },
                ]}
              />
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-bold tracking-wide shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition mt-2"
            >
              {isLoading
                ? isRegister
                  ? 'Registering Account...'
                  : 'Signing In...'
                : isRegister
                ? 'Create New Account'
                : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Credentials Selector */}
          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 text-center uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Quick Demo Accounts
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin('admin@example.com', 'Admin@123')}
                  className="p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-left transition"
                >
                  <div className="text-[11px] font-bold text-purple-900">Admin</div>
                  <div className="text-[10px] text-purple-600 truncate">admin@example.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin('sales@example.com', 'Sales@123')}
                  className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition"
                >
                  <div className="text-[11px] font-bold text-blue-900">Sales</div>
                  <div className="text-[10px] text-blue-600 truncate">sales@example.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin('warehouse@example.com', 'Warehouse@123')}
                  className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left transition"
                >
                  <div className="text-[11px] font-bold text-amber-900">Warehouse</div>
                  <div className="text-[10px] text-amber-600 truncate">warehouse@example.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin('accounts@example.com', 'Accounts@123')}
                  className="p-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-left transition"
                >
                  <div className="text-[11px] font-bold text-teal-900">Accounts</div>
                  <div className="text-[10px] text-teal-600 truncate">accounts@example.com</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
