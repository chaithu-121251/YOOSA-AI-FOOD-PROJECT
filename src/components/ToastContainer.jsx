import { useAppContext } from '../context/AppContext';

export default function ToastContainer() {
  const { toasts } = useAppContext();
  if (!toasts?.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.kind || ''}`}>{t.message}</div>
      ))}
    </div>
  );
}
