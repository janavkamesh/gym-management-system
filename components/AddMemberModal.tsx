'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createMember, updateMember, getNextMemberUid } from '@/lib/actions/members';
import { useToast } from './ToastProvider';
import { X, ChevronDown } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { Dropdown } from './ui/Dropdown';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

export default function AddMemberModal({ isOpen, plans, trainers = [], onClose, memberToEdit }: { isOpen: boolean; plans: any[]; trainers?: any[]; onClose: (updatedMember?: any) => void; memberToEdit?: any }) {
  const [name, setName] = useState(memberToEdit?.name || '');
  const [phone, setPhone] = useState(memberToEdit?.phone || '');
  const [uidPreview, setUidPreview] = useState(memberToEdit?.uid || 'Loading...');
  const [gender, setGender] = useState(memberToEdit?.gender || '');
  
  useEffect(() => {
    if (!memberToEdit) {
      getNextMemberUid().then(setUidPreview).catch(() => setUidPreview('GM-XXXX'));
    }
  }, [memberToEdit]);
  
  const activePtAssignment = memberToEdit?.pt_assignments?.find((pt: any) => pt.is_active);
  const [hasPt, setHasPt] = useState(!!activePtAssignment);
  const [trainerId, setTrainerId] = useState(activePtAssignment?.trainer_id || '');
  
  // Custom Dropdown state
  const [planId, setPlanId] = useState(memberToEdit?.plan_id || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [ptFee, setPtFee] = useState(activePtAssignment?.fee_amount ? activePtAssignment.fee_amount.toString() : '');
  const [trainerShare, setTrainerShare] = useState(activePtAssignment?.trainer_share ? activePtAssignment.trainer_share.toString() : '');
  const [ptDurationDays, setPtDurationDays] = useState(activePtAssignment?.duration_days ? activePtAssignment.duration_days.toString() : '');
  const ptDurationDropdownRef = useRef<HTMLDivElement>(null);
  const [isPtDurationDropdownOpen, setIsPtDurationDropdownOpen] = useState(false);

  const [joinDate, setJoinDate] = useState(memberToEdit?.join_date || new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(memberToEdit?.expiry_date || '');
  const [isExpiryManuallyEdited, setIsExpiryManuallyEdited] = useState(!!memberToEdit);
  
  const firstPayment = memberToEdit?.payments?.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const [amount, setAmount] = useState(firstPayment ? firstPayment.amount.toString() : '');
  const [paymentId] = useState(firstPayment?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showToast } = useToast();

  const trainerDropdownRef = useRef<HTMLDivElement>(null);
  const [isTrainerDropdownOpen, setIsTrainerDropdownOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest?.('#plan-dropdown-portal')
      ) {
        setIsDropdownOpen(false);
      }
      if (
        trainerDropdownRef.current && 
        !trainerDropdownRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest?.('#trainer-dropdown-portal')
      ) {
        setIsTrainerDropdownOpen(false);
      }
      if (
        ptDurationDropdownRef.current && 
        !ptDurationDropdownRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest?.('#pt-duration-dropdown-portal')
      ) {
        setIsPtDurationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-calculate expiry date
  useEffect(() => {
    if (isExpiryManuallyEdited) return; // Do not overwrite manual edits

    if (planId && joinDate) {
      const selectedPlan = plans.find(p => p.id === planId);
      if (selectedPlan) {
        const join = new Date(joinDate);
        if (!isNaN(join.getTime())) {
          join.setDate(join.getDate() + Number(selectedPlan.duration_days));
          setExpiryDate(join.toISOString().split('T')[0]);
        }
      }
    }
  }, [planId, joinDate, plans, isExpiryManuallyEdited]);

  // Validation
  const isValidPhone = /^\d{10}$/.test(phone);
  const isPtValid = !hasPt || (hasPt && trainerId !== '' && ptFee.trim() !== '' && trainerShare.trim() !== '' && ptDurationDays !== '');
  const isAmountValid = amount.trim() !== '';
  const isValid = name.trim() !== '' && isValidPhone && planId !== '' && joinDate !== '' && isPtValid && isAmountValid;

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(e.target.value);
    setIsExpiryManuallyEdited(true); // Lock auto-calculation
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setPhone(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      if (memberToEdit) {
        const updated = await updateMember(memberToEdit.id, {
          name,
          phone,
          plan_id: planId,
          join_date: joinDate,
          expiry_date: expiryDate || undefined,
          pt: { 
            hasPt, 
            trainerId, 
            ptFee: ptFee ? Number(ptFee) : undefined, 
            trainerShare: trainerShare ? Number(trainerShare) : undefined, 
            ptDurationDays: ptDurationDays ? Number(ptDurationDays) : undefined 
          },
          payment: { id: paymentId, amount: amount ? Number(amount) : undefined },
          gender: gender ? gender : undefined
        });
        showToast('Member updated successfully', 'success');
        onClose(updated);
      } else {
        const newMember = await createMember({
          name,
          phone,
          plan_id: planId,
          join_date: joinDate,
          expiry_date: expiryDate || undefined,
          payment_amount: amount ? Number(amount) : undefined,
          payment_method: 'Cash',
          pt: { 
            hasPt, 
            trainerId, 
            ptFee: ptFee ? Number(ptFee) : undefined, 
            trainerShare: trainerShare ? Number(trainerShare) : undefined, 
            ptDurationDays: ptDurationDays ? Number(ptDurationDays) : undefined 
          },
          gender: gender ? gender : undefined
        });
        showToast('Member added successfully', 'success');
        onClose();
      }
    } catch (error) {
      showToast('Failed to save. Check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === planId);

  return (
    <ModalTransition 
      isOpen={isOpen} 
      onClose={() => onClose()}
      containerClassName="bg-white rounded-t-2xl md:rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden md:animate-fade-in max-h-90vh flex flex-col"
      mobileFixed
    >
      <ModalHeader title={memberToEdit ? 'Edit Member' : 'Add Member'} onClose={() => onClose()} variant="light" />

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden border-t border-slate-200 md:border-t-0">
          <div className="px-6 pt-3 pb-3 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-x-6 md:gap-y-5">
              {/* Name */}
              <div className="col-span-1 md:col-start-1 md:row-start-1 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-1 truncate">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600 truncate"
                  placeholder="e.g. John Doe"
                />
              </div>

              {/* UID */}
              <div className="col-span-1 md:col-start-1 md:row-start-2 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-1 truncate">UID</label>
                <input
                  type="text"
                  value={uidPreview}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-lg min-h-12 md:min-h-0 cursor-not-allowed truncate"
                />
              </div>

              {/* Phone */}
              <div className="col-span-1 md:col-start-1 md:row-start-3 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-1 truncate">
                  Phone <span className="text-red-500">*</span> 
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600 truncate ${
                    phone.length > 0 && !isValidPhone ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                  placeholder="9876543210"
                />
              </div>

              {/* Plan */}
              <div className="col-span-1 md:col-start-2 md:row-start-1 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-1 truncate">Plan <span className="text-red-500">*</span></label>
                <Dropdown
                  value={planId}
                  onChange={(val) => {
                    setPlanId(val);
                    const plan = plans.find(p => p.id === val);
                    if (plan) setAmount(plan.price.toString());
                  }}
                  options={plans
                    .filter(p => p.is_active !== false)
                    .sort((a, b) => a.duration_days - b.duration_days)
                    .map(p => ({ value: p.id, label: p.plan_name }))}
                  placeholder="Select a plan"
                  className="w-full"
                />
              </div>

              {/* Phone Validation Error */}
              {phone.length > 0 && !isValidPhone && (
                <div className="col-span-2 md:col-span-1 md:col-start-1 md:row-start-4 text-red-500 text-xs mt-[-16px]">
                  (10 digits required)
                </div>
              )}

              {/* Join Date */}
              <div className="col-span-1 md:col-start-2 md:row-start-2 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-1 truncate">Join Date <span className="text-red-500">*</span></label>
                <DatePicker
                  value={joinDate}
                  onChange={(date) => {
                    setJoinDate(date);
                    setIsExpiryManuallyEdited(false);
                  }}
                />
              </div>

              {/* Expiry Date */}
              <div className="col-span-1 md:col-start-2 md:row-start-3 min-w-0">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-slate-700 truncate">
                    Expiry Date
                  </label>
                </div>
                <DatePicker
                  value={expiryDate}
                  onChange={(date) => {
                    setExpiryDate(date);
                    setIsExpiryManuallyEdited(true);
                  }}
                  placeholder="Pick date (Editable)"
                />
              </div>

              {/* Amount */}
              <div className="col-span-1 md:col-start-3 md:row-start-1 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-1 truncate">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">₹</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600 truncate"
                    placeholder="e.g. 1500"
                    min="0"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="col-span-1 md:col-start-3 md:row-start-2 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-1 truncate">
                  Gender
                </label>
                <Dropdown
                  value={gender}
                  onChange={setGender}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                  placeholder="Select (Optional)"
                  className="w-full"
                />
              </div>

              {/* PT Toggle */}
              <div className="col-span-2 md:col-span-1 md:col-start-3 md:row-start-3 flex items-center justify-between pt-1 min-w-0">
                <label className="block text-sm font-medium text-slate-700 truncate">Personal Training</label>
                <button
                  type="button"
                  onClick={() => setHasPt(!hasPt)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    hasPt ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      hasPt ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {hasPt && (
              <div className="mt-6 pt-4 border-t border-slate-200 bg-white md:bg-slate-50/50 -mx-6 px-6 pb-2">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Personal Training Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-x-6 md:gap-y-5">
                  <div className="col-span-1 min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-1 truncate">Trainer <span className="text-red-500">*</span></label>
                    <Dropdown
                      value={trainerId}
                      onChange={setTrainerId}
                      options={trainers.map((t: any) => ({ value: t.id, label: t.name }))}
                      placeholder="Select a trainer"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="col-span-1 min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-1 truncate">Duration <span className="text-red-500">*</span></label>
                    <Dropdown
                      value={ptDurationDays}
                      onChange={(val) => {
                        setPtDurationDays(val);
                        const ptPlan = [
                          { days: '30', price: 5000 },
                          { days: '90', price: 13500 },
                          { days: '180', price: 25000 },
                          { days: '365', price: 45000 },
                        ].find(p => p.days === val);
                        if (ptPlan) setPtFee(ptPlan.price.toString());
                      }}
                      options={[
                        { value: '30', label: '1 Month' },
                        { value: '90', label: '3 Months' },
                        { value: '180', label: '6 Months' },
                        { value: '365', label: '1 Year' },
                      ]}
                      placeholder="Select duration"
                      className="w-full"
                    />
                  </div>

                  <div className="col-span-1 min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-1 truncate">PT Fee <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-medium">₹</span>
                      </div>
                      <input
                        type="number"
                        value={ptFee}
                        onChange={(e) => setPtFee(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600 truncate"
                        placeholder="e.g. 5000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-1 truncate">Share (%) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={trainerShare}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val >= 0 && val <= 100) setTrainerShare(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600 truncate"
                      placeholder="e.g. 50"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pt-2 pb-4 bg-white shrink-0 flex justify-end gap-3 border-t border-slate-200 md:border-t-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg min-h-12 md:min-h-0 transition-colors touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg min-h-12 md:min-h-0 shadow-sm transition-colors active:scale-95 duration-120 touch-manipulation"
            >
              {isSubmitting ? 'Saving...' : (memberToEdit ? 'Save Changes' : 'Save Member')}
            </button>
          </div>
        </form>
    </ModalTransition>
  );
}
