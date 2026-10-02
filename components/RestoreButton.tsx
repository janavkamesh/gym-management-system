import { Undo2 } from 'lucide-react';

interface RestoreButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isRestoring?: boolean;
}

export default function RestoreButton({ onClick, isRestoring }: RestoreButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isRestoring}
      className="inline-flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-medium hover:bg-emerald-100 active:scale-95 disabled:opacity-50 transition-all min-h-[44px] md:min-h-[36px] px-3 whitespace-nowrap opacity-100"
    >
      <Undo2 size={16} className={`mr-[6px] ${isRestoring ? 'animate-spin' : ''}`} />
      Restore
    </button>
  );
}
