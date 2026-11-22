import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock3,
} from 'lucide-react';

function StatusBadge({ status }) {
  const config = {
    open: {
      label: 'Pendaftaran Dibuka',
      icon: CheckCircle2,
      classes: 'bg-green-50 text-green-700 ring-green-200',
    },
    closed: {
      label: 'Pendaftaran Ditutup',
      icon: XCircle,
      classes: 'bg-red-50 text-red-700 ring-red-200',
    },
    upcoming: {
      label: 'Belum Dibuka',
      icon: Clock3,
      classes: 'bg-amber-50 text-amber-700 ring-amber-200',
    },
  };

  const item = config[status];

  if (!item) return null;

  const Icon = item.icon;

  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ring-inset ${item.classes}`}
    >
      <Icon size={13} />
      {item.label}
    </span>
  );
}

export default StatusBadge;