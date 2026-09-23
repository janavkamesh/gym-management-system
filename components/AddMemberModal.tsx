'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createMember, updateMember } from '@/lib/actions/members';
import { useToast } from './ToastProvider';
import { X, ChevronDown } from 'lucide-react';
import { DatePicker } from './DatePicker';

export default function AddMemberModal({ plans, onClose, memberToEdit }: { plans: any[]; onClose: (updatedMember?: any) => void; memberToEdit?: any }) {
  const [name, setName] = useState(memberToEdit?.name || '');
  const [phone, setPhone] = useState(memberToEdit?.phone || '');
  
  // Custom Dropdown state
  const [planId, setPlanId] = useState(memberToEdit?.plan_id || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [joinDate, setJoinDate] = useState(memberToEdit?.join_date || new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(memberToEdit?.expiry_date || '');
  const [isExpiryManuallyEdited, setIsExpiryManuallyEdited] = useState(!!memberToEdit);
  
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showToast } = useToast();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest?.('#plan-dropdown-portal')
      ) {
        setIsDropdownOpen(false);
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
  const isValid = name.trim() !== '' && isValidPhone && planId !== '' && joinDate !== '';

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
        });
        showToast('Member updated successfully', 'success');
        onClose(updated);
      } else {
        await createMember({
          name,
          phone,
          plan_id: planId,
          join_date: joinDate,
          expiry_date: expiryDate || undefined,
          payment_amount: amount ? Number(amount) : undefined,
          payment_method: 'Cash',
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
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/50"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-2xl md:rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up md:animate-fade-in max-h-90vh flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 shrink-0">
          <h2 className="text-xl font-semibold text-slate-900">{memberToEdit ? 'Edit Member' : 'Add Member'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-120 rounded-full p-2 md:p-1.5 touch-manipulation min-h-12 min-w-12 md:min-h-8 md:min-w-8 flex items-center justify-center">
            <X size={24} className="md:w-5 md:h-5 transition-transform duration-120" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Row 1: Name and Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone <span className="text-red-500">*</span> 
                {phone.length > 0 && !isValidPhone && <span className="text-red-500 text-xs ml-2 font-normal">(10 digits required)</span>}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className={`w-full px-3 py-2 border rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  phone.length > 0 && !isValidPhone ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="9876543210"
              />
            </div>

            {/* Row 2: Plan and Join Date */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plan <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg min-h-12 md:min-h-10.5 bg-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"
              >
                <span className={selectedPlan ? 'text-slate-900' : 'text-slate-400'}>
                  {selectedPlan ? selectedPlan.plan_name : 'Select a plan'}
                </span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && typeof document !== 'undefined' && createPortal(
                <div 
                  id="plan-dropdown-portal"
                  className="fixed z-9999 bg-white border border-slate-200 rounded-lg shadow-md max-h-60 overflow-y-auto mt-1"
                  style={{
                    top: dropdownRef.current?.getBoundingClientRect().bottom,
                    left: dropdownRef.current?.getBoundingClientRect().left,
                    width: dropdownRef.current?.getBoundingClientRect().width,
                  }}
                >
                  <ul className="py-1">
                    {plans.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-slate-500 text-center">No plans available</li>
                    ) : (
                      plans.map((plan) => (
                        <li key={plan.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setPlanId(plan.id);
                              setIsDropdownOpen(false);
                              setIsExpiryManuallyEdited(false);
                            }}
                            className="w-full text-left px-4 py-3 md:py-2 text-sm hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between"
                          >
                            <span className="font-medium text-slate-900">{plan.plan_name}</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>,
                document.body
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Join Date <span className="text-red-500">*</span></label>
              <DatePicker
                value={joinDate}
                onChange={(date) => {
                  setJoinDate(date);
                  setIsExpiryManuallyEdited(false); // Reset override to allow recalculation
                }}
              />
            </div>

            {/* Row 3: Expiry Date and Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expiry Date <span className="text-slate-400 font-normal text-xs ml-1">(Editable)</span>
              </label>
              <DatePicker
                value={expiryDate}
                onChange={(date) => {
                  setExpiryDate(date);
                  setIsExpiryManuallyEdited(true); // Lock auto-calculation
                }}
                placeholder="Pick expiry date"
              />
            </div>

            {!memberToEdit && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid <span className="text-slate-400 font-normal text-xs ml-1">(Optional)</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">₹</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g. 1500"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
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
      </div>
    </div>
  );
}
