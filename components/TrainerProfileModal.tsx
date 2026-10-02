'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, Clock, IndianRupee, MessageCircle, Wallet, ReceiptText, LayoutDashboard, Award, Banknote, IdCard, Phone, PersonStanding, Bell, Star, Dumbbell, Coins, Briefcase, Trash2 } from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';
import { cleanPhone } from '@/lib/utils/whatsapp';
import Badge from './ui/Badge';
import { WhatsAppIcon } from './MemberRow';
import { fetchTrainerStats, fetchTrainerPtClients, fetchTrainerLedger } from '@/lib/actions/trainers';
import TrainerPtClientsTable from './TrainerPtClientsTable';
import TrainerLedgerTable from './TrainerLedgerTable';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

interface TrainerProfileModalProps {
  isOpen: boolean;
  trainer: any;
  onClose: () => void;
  onRemove?: () => void;
}

export default function TrainerProfileModal({ isOpen, trainer, onClose, onRemove }: TrainerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'personal training' | 'payments'>('overview');
  
  const [stats, setStats] = useState<any>(null);
  const [ptClients, setPtClients] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (!isOpen) return;
    
    let mounted = true;
    setIsLoading(true);
    
    Promise.all([
      fetchTrainerStats(trainer.id),
      fetchTrainerPtClients(trainer.id),
      fetchTrainerLedger(trainer.id)
    ]).then(([statsData, ptData, ledgerData]) => {
      if (mounted) {
        setStats(statsData);
        setPtClients(ptData || []);
        setLedger(ledgerData || []);
        setIsLoading(false);
      }
    }).catch((err) => {
      console.error(err);
      if (mounted) setIsLoading(false);
    });

    return () => { mounted = false; };
  }, [trainer.id, isOpen]);



  const handleWaAction = () => {
    const phone = cleanPhone(trainer.phone);
    const message = `Hi ${trainer.name}, welcome to the team! You've been added as a trainer starting ${new Date(trainer.join_date).toLocaleDateString('en-GB')} with a base salary of ${formatINR(trainer.base_salary)}. We're excited to work with you!`;
    const link = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(link, '_blank');
  };

  if (!trainer && !isOpen) return null;

  return (
    <ModalTransition 
      isOpen={isOpen} 
      onClose={onClose}
      containerClassName="bg-white w-full md:max-w-4xl rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col h-[90vh] md:h-[80vh] overflow-hidden"
      mobileFixed
    >
      <ModalHeader title="Trainer Profile" onClose={onClose} variant="light" />

      <div className="w-full h-px bg-slate-200 shrink-0 lg:hidden" />
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden overscroll-contain bg-white">
        <div className="profile-section-spacing pt-4 shrink-0">
          {/* Gap background and Info Card */}
        <div className="px-4 md:px-6 shrink-0 bg-white z-10">
          <div className="profile-header-card !py-6 lg:!py-5 items-center">
            <div className="w-[50px] h-[50px] lg:w-[64px] lg:h-[64px] rounded-full bg-slate-700 flex items-center justify-center text-xl lg:text-2xl font-bold text-white shrink-0 uppercase shadow-inner">
              {trainer.name.charAt(0)}
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2 flex-1 min-w-0 justify-center lg:pr-[120px]">
              {/* Row 1 */}
              <div className="flex items-center gap-2 flex-nowrap">
                <h2 className="text-lg font-semibold text-white truncate leading-tight">{trainer.name}</h2>
                <div className="shrink-0 px-1 py-[2px] bg-slate-800 text-slate-300 text-[9px] font-medium rounded border border-slate-700 leading-none">
                  {trainer.uid || 'No UID'}
                </div>
              </div>
            </div>

            {/* Action Icons in Top Right */}
            <div className="flex items-center justify-end gap-2 lg:absolute lg:top-0 lg:bottom-0 lg:right-5 lg:gap-2.5">
              <button onClick={handleWaAction} className="group profile-action-btn text-green-400 !lg:w-[64px] !lg:h-[64px] !lg:min-w-0 !lg:p-0 !lg:justify-center" title="Welcome Msg" aria-label="Welcome Msg">
                <div className="profile-action-circle !w-[50px] !h-[50px]">
                  <div className="lg:hidden"><WhatsAppIcon size={22} /></div>
                  <div className="hidden lg:block"><WhatsAppIcon size={28} /></div>
                </div>
                <span className="profile-action-btn-text lg:mt-1 absolute top-full mt-1 left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">Welcome</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stat Chip Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white px-6 shrink-0">
          <div className="profile-card rounded-xl p-3 flex items-center gap-3 last:odd:col-span-2 md:last:odd:col-span-1">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-white">
              <Briefcase size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">Base Salary</div>
              <div className="text-sm font-semibold text-slate-900 truncate">{formatINR(trainer.base_salary)}</div>
            </div>
          </div>
          <div className="profile-card rounded-xl p-3 flex items-center gap-3 last:odd:col-span-2 md:last:odd:col-span-1">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white">
              <Dumbbell size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">PT Clients</div>
              <div className="text-sm font-semibold text-slate-900 capitalize">
                {isLoading ? '-' : stats?.ptClientsCount || 0}
              </div>
            </div>
          </div>
          <div className="profile-card rounded-xl p-3 flex items-center gap-3 last:odd:col-span-2 md:last:odd:col-span-1">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white">
              <Wallet size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">Lifetime Paid</div>
              <div className="text-sm font-semibold text-slate-900">{isLoading ? '-' : formatINR(stats?.lifetimePaid || 0)}</div>
            </div>
          </div>
          <div className="profile-card rounded-xl p-3 flex items-center gap-3 last:odd:col-span-2 md:last:odd:col-span-1">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-white">
              <Banknote size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">Pending Advance</div>
              <div className={`text-sm font-semibold ${(stats?.pendingAdvance || 0) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {isLoading ? '-' : formatINR(stats?.pendingAdvance || 0)}
              </div>
            </div>
          </div>
          <div className="profile-card rounded-xl p-3 flex items-center gap-3 last:odd:col-span-2 md:last:odd:col-span-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white">
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">This Month</div>
              <div className={`text-sm font-semibold capitalize ${stats?.thisMonthStatus === 'Paid' ? 'text-green-600' : 'text-slate-900'}`}>
                {isLoading ? '-' : stats?.thisMonthStatus || 'Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Tabs */}
        <div className="profile-tab-container sticky top-0 z-20 lg:relative lg:top-auto lg:z-auto">
          {(['overview', 'personal training', 'payments'] as const).map(tab => {
            const TabIcon = tab === 'overview' ? LayoutDashboard : tab === 'personal training' ? Dumbbell : Banknote;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`profile-tab-btn relative ${
                  activeTab === tab ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-label={tab}
                role="tab"
              >
                <TabIcon size={18} className="md:w-4 md:h-4" />
                <span className="whitespace-nowrap capitalize">{tab === 'personal training' ? 'PT Clients' : tab}</span>
              </button>
            );
          })}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 bg-white p-6 pb-safe relative lg:overflow-y-auto min-h-[calc(100%-48px)] lg:min-h-0">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm font-medium text-slate-500">Loading trainer data...</div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="w-full">
                  {/* Identity Section */}
                  <div className="profile-row shadow-sm rounded-2xl flex flex-col relative w-full">
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 rounded-t-2xl">
                      <IdCard size={14} className="text-slate-500" />
                      <h3 className="font-medium text-slate-700 text-sm">Identity</h3>
                    </div>
                    
                    {(() => {
                      const identityTiles = [
                        { id: 'phone', icon: Phone, label: 'Phone Number', value: trainer.phone },
                        { id: 'joined', icon: Calendar, label: 'Joined Date', value: new Date(trainer.join_date).toLocaleDateString('en-GB', { dateStyle: 'medium' }) }
                      ];
                      return (
                        <div className={`p-4 flex flex-col lg:grid ${identityTiles.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-3 rounded-b-2xl`}>
                          {identityTiles.map(tile => (
                            <div key={tile.id} className="profile-card shadow-none p-3 rounded-lg flex items-center gap-3 min-w-0">
                              <tile.icon size={16} className="text-slate-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] text-slate-500 font-medium capitalize mb-0.5">{tile.label}</div>
                                <div className="text-sm text-slate-900 font-medium truncate">{tile.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {activeTab === 'personal training' && (
                <TrainerPtClientsTable clients={ptClients} />
              )}

              {activeTab === 'payments' && (
                <TrainerLedgerTable ledger={ledger} />
              )}
            </>
          )}
        </div>
      </div>
        
        {/* Mobile Footer Actions */}
        {onRemove && (
          <div className="shrink-0 border-t border-slate-200 bg-white p-4 pb-safe flex gap-3 lg:hidden">
            <button
              onClick={() => {
                onClose();
                onRemove();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl font-medium transition-all duration-200 active:scale-95 touch-manipulation"
            >
              <Trash2 size={18} />
              Remove Trainer
            </button>
          </div>
        )}
      </ModalTransition>
  );
}
