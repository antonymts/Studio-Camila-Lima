import React, { useState } from 'react';
import { X, Lock, Mail, KeyRound, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginAdmin(email, password);
    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Acesso negado. Verifique os dados fornecidos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-rose-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-rose-100 overflow-hidden">
        {/* Header */}
        <div className="bg-rose-950 text-white p-6 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-rose-900 text-rose-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-rose-900 border border-rose-700 mx-auto mb-3 flex items-center justify-center text-amber-300">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-xl">Painel Camila Lima</h3>
          <p className="text-xs text-rose-300 mt-1">
            Área de gestão exclusiva da profissional
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-rose-900 mb-1">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-rose-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-rose-200 text-rose-950 text-sm focus:ring-2 focus:ring-rose-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-900 mb-1">
              Senha
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-rose-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-rose-200 text-rose-950 text-sm focus:ring-2 focus:ring-rose-800 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-rose-900 hover:bg-rose-950 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Entrando...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar no Painel</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
