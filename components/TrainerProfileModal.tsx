'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, Clock, IndianRupee, MessageCircle, Wallet, ReceiptText, LayoutDashboard, Award, Banknote, IdCard, Phone, PersonStanding, Bell, Star, Dumbbell, Coins, Briefcase } from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';
import { cleanPhone } from '@/lib/utils/whatsapp';
import Badge from './ui/Badge';
import { WhatsAppIcon } from './MemberRow';
import { fetchTrainerStats, fetchTrainerPtClients, fetchTrainerLedger } from '@/lib/actions/trainers';
import TrainerPtClientsTable from './TrainerPtClientsTable';
import TrainerLedgerTable from './TrainerLedgerTable';

interface TrainerProfileModalProps {
  trainer: any;
  onClose: () => void;
}

export default function TrainerProfileModal({ trainer, onClose }: TrainerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'personal training' | 'payments'>('overview');
  
  const [stats, setStats] = useState<any>(null);
  const [ptClients, setPtClients] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
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
  }, [trainer.id]);

  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const updateIndicator = () => {
      const tabs = ['overview', 'personal training', 'payments'];
      const activeIndex = tabs.indexOf(activeTab);
      const buttons = tabsContainerRef.current?.querySelectorAll('button');
      if (!buttons) return;
      const activeButton = buttons[activeIndex];
      
      if (activeButton) {
        setTabIndicatorStyle({
          width: activeButton.offsetWidth,
          left: activeButton.offsetLeft,
        });
      }
    };

    updateIndicator();
    // Use setTimeout to ensure DOM has updated
    setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  const handleWaAction = () => {
    const phone = cleanPhone(trainer.phone);
    const message = `Hi ${trainer.name}, welcome to the team! You've been added as a trainer starting ${new Date(trainer.join_date).toLocaleDateString('en-GB')} with a base salary of ${formatINR(trainer.base_salary)}. We're excited to work with you!`;
    const link = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(link, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onPointerDown={onClose}></div>
      <div className="relative bg-slate-50 w-full md:max-w-4xl rounded-t-2xl md:rounded-2xl shadow-2xl z-10 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-200 flex flex-col h-[90vh] md:h-[80vh] overflow-hidden">
        
        {/* Slim Title Bar */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0 bg-slate-900 border-b border-slate-800 relative z-20">
          <h2 className="text-base font-semibold text-white">Trainer Profile</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-120 rounded-full p-1.5 -mr-1.5"
          >
            <X size={20} className="transition-transform duration-120" />
          </button>
        </div>

        {/* Gap background and Info Card */}
        <div className="px-4 md:px-6 py-4 shrink-0 bg-slate-50 z-10">
          <div className="p-5 bg-slate-900 rounded-2xl relative shadow-md">
            {/* Action Icons in Top Right */}
            <div className="absolute top-4 right-5 bottom-4 flex items-stretch gap-2.5">
              <button onClick={handleWaAction} className="flex flex-col items-center justify-between px-3 pt-3 pb-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-green-400 border border-slate-700/50 min-w-[80px]" title="Welcome Msg">
                <div className="flex-1 flex items-center justify-center">
                  <WhatsAppIcon size={28} />
                </div>
                <span className="text-[10px] font-medium text-slate-300">Welcome Msg</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-white shrink-0 uppercase shadow-inner">
                {trainer.name.charAt(0)}
              </div>
              <div className="flex flex-col gap-1 pr-[120px] min-w-0 justify-center">
                {/* Row 1 */}
                <div className="flex items-center flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-white truncate leading-tight">{trainer.name}</h2>
                </div>
                
                {/* Row 2 */}
                <div className="mt-0.5">
                  <div className="inline-block px-1 py-[2px] bg-slate-800 text-slate-300 text-[9px] font-medium rounded border border-slate-700 leading-none">
                    {trainer.uid || 'No UID'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Chip Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white px-6 py-4 shrink-0">
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-200/60">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-white">
              <Briefcase size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">Base Salary</div>
              <div className="text-sm font-semibold text-slate-900 truncate">{formatINR(trainer.base_salary)}</div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-200/60">
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
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-200/60">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white">
              <Wallet size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">Lifetime Paid</div>
              <div className="text-sm font-semibold text-slate-900">{isLoading ? '-' : formatINR(stats?.lifetimePaid || 0)}</div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-200/60">
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
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-200/60">
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

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 shrink-0 bg-white relative" ref={tabsContainerRef}>
          <div 
            className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-120 ease-out left-0"
            style={{
              width: `${tabIndicatorStyle.width}px`,
              transform: `translateX(${tabIndicatorStyle.left}px)`,
            }}
          />
          {(['overview', 'personal training', 'payments'] as const).map(tab => {
            const TabIcon = tab === 'overview' ? LayoutDashboard : tab === 'personal training' ? Dumbbell : Banknote;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-colors relative z-10 flex items-center gap-2 ${
                  activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <TabIcon size={16} />
                {tab}
              </button>
            );
          })}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-white p-6 pb-safe relative">
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
                <div className="w-full max-w-sm">
                  {/* Identity Section */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col relative w-full">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 rounded-t-2xl">
                      <IdCard size={14} className="text-slate-500" />
                      <h3 className="font-medium text-slate-700 text-sm">Identity</h3>
                    </div>
                    
                    <div className="p-4 flex flex-col gap-3 bg-white rounded-b-2xl">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                        <Phone size={16} className="text-slate-400" />
                        <div>
                          <div className="text-[11px] text-slate-500 font-medium capitalize mb-0.5">Phone Number</div>
                          <div className="text-sm text-slate-900 font-medium">{trainer.phone}</div>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                        <Calendar size={16} className="text-slate-400" />
                        <div>
                          <div className="text-[11px] text-slate-500 font-medium capitalize mb-0.5">Joined Date</div>
                          <div className="text-sm text-slate-900 font-medium">{new Date(trainer.join_date).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</div>
                        </div>
                      </div>
                    </div>
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
    </div>,
    document.body
  );
}
