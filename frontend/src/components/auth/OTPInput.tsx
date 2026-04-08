import { useState, useRef } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const OTPInput = ({ length = 6, value, onChange, disabled = false }: OTPInputProps) => {
  const [otp, setOtp] = useState<string[]>(
    value.split('').concat(Array(length).fill('')).slice(0, length)
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    // Only allow digits
    if (digit && !/^\d$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    const otpValue = newOtp.join('');
    onChange(otpValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newOtp = pastedData.split('').concat(Array(length).fill('')).slice(0, length);
    setOtp(newOtp);
    onChange(pastedData);

    // Focus last filled input or first empty
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={ref => {
            inputRefs.current[index] = ref;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-12 sm:w-14 sm:h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-xl focus:border-[#667eea] focus:outline-none focus:ring-2 focus:ring-[#667eea]/20 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all hover:border-[#667eea]/50"
          autoComplete="off"
        />
      ))}
    </div>
  );
};
export default OTPInput;
