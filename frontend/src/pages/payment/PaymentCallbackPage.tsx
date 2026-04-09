import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { billingService } from '../../services/billing.service';
import type { BillResponse } from '../../types/billing.types';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

type CallbackState = 'verifying' | 'success' | 'failed';

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [state, setState] = useState<CallbackState>('verifying');
  const [bill, setBill] = useState<BillResponse | null>(null);
  const [failureReason, setFailureReason] = useState('');

  useEffect(() => {
    const pidx = searchParams.get('pidx');
    const status = searchParams.get('status');

    if (!pidx) {
      setFailureReason('Missing payment reference (pidx).');
      setState('failed');
      return;
    }

    // Khalti sends status in the callback URL — but we MUST verify server-side
    if (status === 'User canceled') {
      setFailureReason('Payment was cancelled.');
      setState('failed');
      return;
    }

    billingService
      .verifyKhaltiPayment({ pidx })
      .then((verified) => {
        setBill(verified);
        setState('success');
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Payment verification failed. Please contact staff.';
        setFailureReason(msg);
        setState('failed');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        {state === 'verifying' && (
          <>
            <Loader size={48} className="mx-auto mb-4 text-purple-600 animate-spin" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
            <p className="text-gray-500 text-sm">Please wait while we confirm your Khalti payment…</p>
          </>
        )}

        {state === 'success' && bill && (
          <>
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <h1 className="text-xl font-bold text-gray-900 mb-1">Payment Successful!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Order #{bill.orderId} — Table {bill.tableNumber}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm mb-6">
              {bill.items.map((item, i) => (
                <div key={i} className="flex justify-between text-gray-700">
                  <span>{item.quantity}× {item.menuItemName}</span>
                  <span>NPR {item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-900">
                <span>Total Paid</span>
                <span className="text-purple-700">NPR {bill.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-4">Your order is being prepared. Enjoy your meal!</p>

            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition text-sm"
            >
              Back to Home
            </button>
          </>
        )}

        {state === 'failed' && (
          <>
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Not Confirmed</h1>
            <p className="text-gray-500 text-sm mb-6">{failureReason}</p>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition text-sm"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
