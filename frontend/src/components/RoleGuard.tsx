import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
  fallbackTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children, fallbackTo }) => {
  const { hasRole } = useAuth();

  if (!hasRole(...roles)) {
    if (fallbackTo) {
      return <Navigate to={fallbackTo} replace />;
    }

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Your account role does not have permission to view or manage this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
