import React from 'react';
import { CustomerStatus, CustomerType, MovementType, ChallanStatus, Role } from '../types';

interface StatusBadgeProps {
  type: 'customerStatus' | 'customerType' | 'movementType' | 'challanStatus' | 'role';
  value: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  let colorClasses = 'bg-gray-100 text-gray-800 border-gray-200';

  if (type === 'customerStatus') {
    switch (value as CustomerStatus) {
      case 'ACTIVE':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
        break;
      case 'LEAD':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20';
        break;
      case 'INACTIVE':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
        break;
    }
  } else if (type === 'customerType') {
    switch (value as CustomerType) {
      case 'WHOLESALE':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'DISTRIBUTOR':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'RETAIL':
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
    }
  } else if (type === 'movementType') {
    switch (value as MovementType) {
      case 'IN':
        colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
        break;
      case 'OUT':
        colorClasses = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
        break;
    }
  } else if (type === 'challanStatus') {
    switch (value as ChallanStatus) {
      case 'CONFIRMED':
        colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium';
        break;
      case 'DRAFT':
        colorClasses = 'bg-sky-100 text-sky-800 border-sky-300 font-medium';
        break;
      case 'CANCELLED':
        colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-medium';
        break;
    }
  } else if (type === 'role') {
    switch (value as Role) {
      case 'ADMIN':
        colorClasses = 'bg-purple-100 text-purple-800 border-purple-200 font-bold';
        break;
      case 'SALES':
        colorClasses = 'bg-blue-100 text-blue-800 border-blue-200 font-bold';
        break;
      case 'WAREHOUSE':
        colorClasses = 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
        break;
      case 'ACCOUNTS':
        colorClasses = 'bg-teal-100 text-teal-800 border-teal-200 font-bold';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${colorClasses}`}
    >
      {value}
    </span>
  );
};
