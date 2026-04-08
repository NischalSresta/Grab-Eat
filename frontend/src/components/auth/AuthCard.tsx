import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthCard = ({ title, description, children, footer }: AuthCardProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-2xl">
            <span className="text-4xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
              GE
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">{title}</h1>
          {description && <p className="text-white/90 mt-2 text-sm">{description}</p>}
        </div>

        {/* Card Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">{children}</div>

        {/* Footer */}
        {footer && <div className="mt-6 text-center text-white/90">{footer}</div>}
      </div>
    </div>
  );
};
export default AuthCard;
