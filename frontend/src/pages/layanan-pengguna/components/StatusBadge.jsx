import React from 'react';

const statusLabels = {
  menunggu: 'Menunggu',
  diproses: 'Sedang Diproses',
  perlu_dilengkapi: 'Perlu Dilengkapi',
  selesai: 'Selesai',
};

const statusStyles = {
  menunggu: 'bg-yellow-100 text-yellow-700',
  diproses: 'bg-blue-100 text-blue-700',
  perlu_dilengkapi: 'bg-orange-100 text-orange-700',
  selesai: 'bg-green-100 text-green-700',
};

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || '').toLowerCase();

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        statusStyles[normalizedStatus] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {statusLabels[normalizedStatus] || status || '-'}
    </span>
  );
}