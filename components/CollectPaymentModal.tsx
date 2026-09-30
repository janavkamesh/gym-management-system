'use client';

import { useState, useRef, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { collectPaymentAmount, collectPtPayment } from '@/lib/actions/payments';
import { useToast } from './ToastProvider';
import { DatePicker } from './DatePicker';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

interface CollectPaymentModalProps {
  isOpen: boolean;
  member: any;
  onClose: () => void;
}

export default function CollectPaymentModal({ isOpen, member, onClose }: CollectPaymentModalProps) {
  const activePt = member.pt_assignments?.find((pt: any) => pt.is_active);
  const hasPt = !!activePt;

  const defaultType = hasPt && (member.ptPendingAmount || 0) > 0 && (member.pendingAmount || 0) <= 0 ? 'Training' : 'Membership';

  const [paymentType, setPaymentType] = useState<'Membership' | 'Training'>(defaultType);
  const [amount, setAmount] = useState(() => {
    const val = defaultType === 'Membership' ? (member.pendingAmount || 0) : (member.ptPendingAmount || 0);
    return val > 0 ? val.toString() : '';
  });
  const [method, setMethod] = useState('Cash');
  const [date, setDate] = useState(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { showToast } = useToast();

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const updateIndicator = () => {
      const tabs = ['Membership', 'Training'];
      const activeIndex = tabs.indexOf(paymentType);
      const buttons = tabsContainerRef.current?.querySelectorAll('button');
      if (!buttons) return;
      const activeButton = buttons[activeIndex];
      
      if (activeButton) {
        setIndicatorStyle({
          width: activeButton.offsetWidth,
          left: activeButton.offsetLeft,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [paymentType]);

  const handleTypeToggle = (type: 'Membership' | 'Training') => {
    setPaymentType(type);
    const val = type === 'Membership' ? (member.pendingAmount || 0) : (member.ptPendingAmount || 0);
    setAmount(val > 0 ? val.toString() : '');
  };

  const daysLeft = member?.expiry_date 
    ? Math.ceil((new Date(member.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    if (paymentType === 'Membership' && daysLeft > 7 && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (paymentType === 'Membership') {
        await collectPaymentAmount(member.id, Number(amount), method, date);
      } else {
        await collectPtPayment(activePt.id, Number(amount), method, date);
      }
      showToast('Payment collected successfully', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to collect payment. Check your connection.', 'error');
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <ModalTransition 
      isOpen={isOpen} 
      onClose={onClose}
      containerClassName="bg-white rounded-t-2xl md:rounded-lg shadow-2xl w-full md:max-w-md overflow-hidden md:animate-fade-in max-h-90vh flex flex-col"
      overlayClassName="z-[60]"
    >
      <ModalHeader 
        title={
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 md:text-white">Amount Collected</h3>
            <p className="text-xs text-slate-500 md:text-slate-300 mt-0.5 md:mt-1">Log payment for {member.name}</p>
          </div>
        } 
        onClose={onClose}
        variant="mobile-light"
      />

        {showConfirmation ? (
          <div className="p-6 pb-safe">
            <div className="flex items-start gap-4 p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">Confirm Membership Extension</h4>
                <p className="text-sm text-yellow-700">
                  {member.name} still has <span className="font-bold">{daysLeft}</span> days left on their current membership. Are you sure you want to collect a payment and extend their membership?
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95 min-h-12"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors active:scale-95 flex justify-center items-center disabled:opacity-50 min-h-12"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 pb-safe">
            {hasPt && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment For</label>
                <div 
                  ref={tabsContainerRef}
                  className="flex relative bg-slate-100 rounded-lg p-1 w-full overflow-x-auto hide-scrollbar touch-manipulation"
                >
                  <div 
                    className="absolute left-0 top-1 bottom-1 bg-navy rounded-md shadow-sm transition-transform duration-120 ease-out"
                    style={{
                      width: `${indicatorStyle.width}px`,
                      transform: `translateX(${indicatorStyle.left}px)`,
                    }}
                  />
                  {['Membership', 'Training'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeToggle(t as 'Membership' | 'Training')}
                      className={`relative z-10 flex-1 px-4 py-2 min-h-12 md:min-h-10 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center justify-center ${
                        paymentType === t 
                          ? 'text-white' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {hasPt ? `Amount for ${paymentType === 'Membership' ? 'Membership' : 'Personal Training'}` : 'Amount'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-medium">₹</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g. 1500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <DatePicker
                value={date}
                onChange={setDate}
                max={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
              <div className="flex gap-2">
                {['Cash', 'UPI', 'Card'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`flex-1 min-h-12 md:min-h-10 py-2 text-sm font-medium rounded-lg border transition-colors active:scale-95 ${
                      method === m 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95 min-h-12"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!amount || Number(amount) <= 0 || isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors active:scale-95 flex justify-center items-center disabled:opacity-50 min-h-12"
              >
                {isSubmitting ? 'Saving...' : 'Collect Payment'}
              </button>
            </div>
          </form>
        )}
    </ModalTransition>
  );
}
