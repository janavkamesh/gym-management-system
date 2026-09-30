'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, ChevronUp, ChevronDown } from 'lucide-react';
import TrainerRow from './TrainerRow';
import AddTrainerModal from './AddTrainerModal';
import { getArchivedTrainers } from '@/lib/actions/trainers';
import PageHeader from './PageHeader';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { RollingSubtext } from './ui/RollingSubtext';

interface TrainersClientProps {
  initialTrainers: any[];
  members: any[];
  initialArchivedCount?: number;
  initialTrainerId?: string;
  initialAction?: string;
}

export default function TrainersClient({ initialTrainers, members, initialArchivedCount = 0, initialTrainerId, initialAction }: TrainersClientProps) {
  const [trainers, setTrainers] = useState(initialTrainers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);

  const handleTrainerAdded = (newTrainer: any) => {
    setTrainers(prev => [...prev, newTrainer].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleTrainerDeleted = (id: string) => {
    setTrainers(prev => prev.filter(t => t.id !== id));
    // Re-fetch archived count if the section is open, or just increment
    if (isArchivedExpanded) {
      loadArchived();
    } else {
      setArchivedCount(prev => prev + 1);
    }
  };

  // Archived State
  const [archivedTrainers, setArchivedTrainers] = useState<any[]>([]);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [archivedCount, setArchivedCount] = useState(initialArchivedCount);
  const [archivedSearchQuery, setArchivedSearchQuery] = useState('');

  const loadArchived = async () => {
    setIsLoadingArchived(true);
    try {
      const data = await getArchivedTrainers();
      setArchivedTrainers(data || []);
      setArchivedCount(data?.length || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingArchived(false);
    }
  };

  const toggleArchived = () => {
    if (!isArchivedExpanded) {
      loadArchived();
    }
    setIsArchivedExpanded(!isArchivedExpanded);
  };

  const filteredArchivedTrainers = archivedTrainers.filter(t => 
    t.name.toLowerCase().includes(archivedSearchQuery.toLowerCase()) || 
    t.phone.includes(archivedSearchQuery)
  );

  const handleRestore = (id: string) => {
    // Optimistically update
    const restoredTrainer = archivedTrainers.find(t => t.id === id);
    if (restoredTrainer) {
      setArchivedTrainers(prev => prev.filter(t => t.id !== id));
      setArchivedCount(prev => prev - 1);
      
      // Add back to main list
      const activeTrainer = { ...restoredTrainer, archived_at: null };
      setTrainers(prev => [...prev, activeTrainer].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const activeStr = `${trainers.length} active`;
  const archivedStr = `${archivedCount} archived`;
  const subtextItems = [activeStr, archivedStr];
  const staticSubtext = `${trainers.length} active · ${archivedCount} archived`;

  return (
    <div className="px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto max-lg:space-y-section lg:space-y-6">
      
      {/* Header */}
      <PageHeader
        title="Trainers"
        subtitle="Manage salaries, PT commissions, and advances."
        mobileSubtitle={<RollingSubtext items={subtextItems} staticText={staticSubtext} />}
        action={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex flex-shrink-0 items-center justify-center gap-2 px-4 min-h-11 lg:min-h-0 py-2.5 w-auto bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-120 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden min-[360px]:inline">Add Trainer</span>
            <span className="min-[360px]:hidden">Add</span>
          </button>
        }
      />

      <div className="mobile-table-card">
        {trainers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Plus size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No trainers added yet</h3>
            <p className="text-slate-500 max-w-sm mb-6">Click 'Add Trainer' to start tracking salaries and PT commissions.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex md:hidden items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all active:scale-95 shadow-sm shadow-blue-200"
            >
              <Plus size={20} />
              Add Trainer
            </button>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="table-header-dark border-b border-slate-200 text-slate-100 text-sm">
                  <tr>
                    <th className="px-4 md:px-6 font-medium text-left rounded-tl-2xl">Name</th>
                    <th className="px-4 md:px-6 font-medium text-left">Phone</th>
                    <th className="px-4 md:px-6 font-medium text-right">Base Salary</th>
                    <th className="px-4 md:px-6 font-medium text-left">Join Date</th>
                    <th className="px-4 md:px-6 font-medium text-center">View</th>
                    <th className="px-4 md:px-6 font-medium text-center">Pay Salary</th>
                    <th className="px-4 md:px-6 font-medium text-center">Log Advance</th>
                    <th className="px-4 md:px-6 font-medium text-center rounded-tr-2xl">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {trainers.map((trainer) => (
                    <TrainerRow 
                      key={`desktop-${trainer.id}`} 
                      trainer={trainer} 
                      members={members}
                      onDeleted={() => handleTrainerDeleted(trainer.id)} 
                      isTarget={initialTrainerId === trainer.id}
                      action={initialTrainerId === trainer.id ? initialAction : undefined}
                      isDesktop={true}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="block lg:hidden flex flex-col w-full">
              <div className="table-header-dark mobile-member-grid mobile-table-header">
                <div className="text-left whitespace-nowrap min-w-0 pr-2">Name</div>
                <div className="text-center justify-self-center whitespace-nowrap min-w-0">Advance</div>
                <div className="text-center justify-self-center whitespace-nowrap min-w-0">Salary</div>
                <div className="text-center justify-self-center whitespace-nowrap min-w-0">View</div>
              </div>
              <div className="flex flex-col">
                {trainers.map((trainer) => (
                  <TrainerRow 
                    key={`mobile-${trainer.id}`} 
                    trainer={trainer} 
                    members={members}
                    onDeleted={() => handleTrainerDeleted(trainer.id)} 
                    isTarget={initialTrainerId === trainer.id}
                    action={initialTrainerId === trainer.id ? initialAction : undefined}
                    isDesktop={false}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Archived Trainers Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors gap-4"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('.archived-search')) return;
            toggleArchived();
          }}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-slate-900">Archived Trainers ({archivedCount})</h3>
            {isArchivedExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
          </div>
          
          {archivedCount > 0 && (
            <div className="relative w-full md:w-70 archived-search">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search archived..."
                value={archivedSearchQuery}
                onChange={(e) => setArchivedSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 min-h-12 md:min-h-0 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder-slate-400"
              />
            </div>
          )}
        </div>

        {isArchivedExpanded && (
          <div className="border-t border-slate-200">
            {isLoadingArchived ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredArchivedTrainers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No archived trainers found.
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="table-header-dark border-b border-slate-200 text-slate-100 text-sm">
                      <tr>
                        <th className="px-4 md:px-6 font-medium text-left rounded-tl-2xl">Name</th>
                        <th className="px-4 md:px-6 font-medium text-left">Phone</th>
                        <th className="px-4 md:px-6 font-medium text-right">Base Salary</th>
                        <th className="px-4 md:px-6 font-medium text-left">Join Date</th>
                        <th className="px-4 md:px-6 font-medium text-right" colSpan={2}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {filteredArchivedTrainers.map((trainer) => (
                        <TrainerRow 
                          key={`desktop-archived-${trainer.id}`} 
                          trainer={trainer} 
                          members={members}
                          onDeleted={() => {}} 
                          onRestore={() => handleRestore(trainer.id)}
                          isDesktop={true}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="block lg:hidden flex flex-col w-full">
                  <div className="table-header-dark mobile-member-grid mobile-table-header">
                    <div className="text-left whitespace-nowrap min-w-0 pr-2">Name</div>
                    <div className="col-start-4 text-center justify-self-center whitespace-nowrap min-w-0">Restore</div>
                  </div>
                  <div className="flex flex-col">
                    {filteredArchivedTrainers.map((trainer) => (
                      <TrainerRow 
                        key={`mobile-archived-${trainer.id}`} 
                        trainer={trainer} 
                        members={members}
                        onDeleted={() => {}} 
                        onRestore={() => handleRestore(trainer.id)}
                        isDesktop={false}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AddTrainerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleTrainerAdded}
      />
    </div>
  );
}
