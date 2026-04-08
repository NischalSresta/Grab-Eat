import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthCard } from '../../components/auth/AuthCard';
import { Alert } from '../../components/auth/Alert';
import { OTPInput } from '../../components/auth/OTPInput';

export const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerification, isLoading } = useAuth();

  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    // Get email from navigation state or sessionStorage
    const stateEmail = location.state?.email;
    const storedEmail = sessionStorage.getItem('pendingVerificationEmail');

    if (stateEmail) {
      setEmail(stateEmail);
      sessionStorage.setItem('pendingVerificationEmail', stateEmail);
    } else if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // No email found, redirect to request page
      navigate('/request-verification');
    }
  }, [location.state, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    try {
      await verifyEmail(email, otp);
      setSuccessMessage('Email verified successfully! Redirecting to login...');
      sessionStorage.removeItem('pendingVerificationEmail');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Invalid verification code');
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setSuccessMessage('');
    setError(null);

    try {
      await resendVerification(email);
      setSuccessMessage('New verification code sent! Check your email.');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthCard
      title="Verify Your Email"
      description={`Enter the 6-digit code sent to ${email}`}
      footer={
        <p className="text-sm">
          Wrong email?{' '}
          <Link
            to="/request-verification"
            className="font-semibold text-white hover:text-white/80 underline underline-offset-2"
          >
            Change email
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
            Verification Code
          </label>
          <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
          <p className="mt-3 text-xs text-gray-500 text-center">
            Enter the 6-digit code from your email
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.length !== 6}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#667eea] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || isLoading}
            className="text-sm font-semibold text-[#667eea] hover:text-[#764ba2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resendLoading ? 'Sending...' : "Didn't receive the code? Resend"}
          </button>
        </div>
      </form>
    </AuthCard>
  );
};

export default VerifyOTPPage;
