interface AlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
}

export const Alert = ({ type, message }: AlertProps) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const icons = {
    error: '⚠',
    success: '✓',
    info: 'ℹ',
  };

  return (
    <div className={`p-4 rounded-lg border ${styles[type]} flex items-start gap-2`}>
      <span className="text-lg">{icons[type]}</span>
      <span className="text-sm flex-1">{message}</span>
    </div>
  );
};
export default Alert;
