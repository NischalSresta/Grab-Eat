import React from 'react';
import { useNavigate } from 'react-router-dom';

const TableBookingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-8">Table Services</h1>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/tables/book')}
            className="w-full bg-white border-2 border-orange-500 rounded-xl p-6 text-left hover:bg-orange-50 transition-colors"
          >
            <div className="text-2xl mb-2">📅</div>
            <h2 className="text-lg font-semibold text-gray-800">Book a Table</h2>
            <p className="text-sm text-gray-500 mt-1">Reserve a table for your upcoming visit</p>
          </button>

          <button
            onClick={() => navigate('/tables/floor-plan')}
            className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">🗺️</div>
            <h2 className="text-lg font-semibold text-gray-800">View Floor Plan</h2>
            <p className="text-sm text-gray-500 mt-1">See live table availability across all floors</p>
          </button>

          <button
            onClick={() => navigate('/tables/my-bookings')}
            className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">📋</div>
            <h2 className="text-lg font-semibold text-gray-800">My Bookings</h2>
            <p className="text-sm text-gray-500 mt-1">View and manage your existing reservations</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableBookingPage;
