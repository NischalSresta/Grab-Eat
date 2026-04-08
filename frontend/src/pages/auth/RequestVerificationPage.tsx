import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { AuthCard } from '../../components/auth/AuthCard';
import { Alert } from '../../components/auth/Alert';
import { Mail } from 'lucide-react';
import { AxiosError } from 'axios';

export const RequestVerificationPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.resendVerification(email);
      // Store email and navigate to OTP page
      sessionStorage.setItem('pendingVerificationEmail', email);
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Email Verification"
      description="Enter your email to receive a verification code"
      footer={
        <p className="text-sm">
          Remember your password?{' '}
          <Link
            to="/login"
            className="font-semibold text-white hover:text-white/80 underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert type="error" message={error} />}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent sm:text-sm transition-all"
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#667eea] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </button>
      </form>
    </AuthCard>
  );
};

export default RequestVerificationPage;
