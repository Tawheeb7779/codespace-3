import React from 'react';
import { X } from 'lucide-react';
import { AuthForm, AuthFormMode } from './AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthFormMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="glass-panel w-full max-w-sm rounded-xl p-5 space-y-4 border border-outline-variant/20 shadow-2xl">
        <div className="flex justify-end -mb-2">
          <button onClick={onClose} className="p-1 text-outline hover:text-white rounded hover:bg-surface-high">
            <X className="w-4 h-4" />
          </button>
        </div>
        <AuthForm initialMode={initialMode} onSuccess={onClose} />
      </div>
    </div>
  );
};
