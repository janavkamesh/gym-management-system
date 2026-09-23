'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import TrainerRow from './TrainerRow';
import AddTrainerModal from './AddTrainerModal';

interface TrainersClientProps {
  initialTrainers: any[];
  members: any[];
}

export default function TrainersClient({ initialTrainers, members }: TrainersClientProps) {
  const [trainers, setTrainers] = useState(initialTrainers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleTrainerAdded = (newTrainer: any) => {
    setTrainers(prev => [...prev, newTrainer].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleTrainerDeleted = (id: string) => {
    setTrainers(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-2">Trainers</h1>
          <p className="text-slate-500 text-sm">Manage salaries, PT commissions, and advances.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-120 text-white text-sm font-medium rounded-lg shadow-sm"
        >
          <Plus size={18} />
          Add Trainer
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
          <div className="overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 md:px-6 py-4 font-medium rounded-tl-2xl">Name</th>
                  <th className="px-4 md:px-6 py-4 font-medium">Phone</th>
                  <th className="px-4 md:px-6 py-4 font-medium">Base Salary</th>
                  <th className="px-4 md:px-6 py-4 font-medium">Join Date</th>
                  <th className="px-4 md:px-6 py-4 font-medium text-center">Manage</th>
                  <th className="px-4 md:px-6 py-4 font-medium text-center rounded-tr-2xl">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {trainers.map((trainer) => (
                  <TrainerRow 
                    key={trainer.id} 
                    trainer={trainer} 
                    members={members}
                    onDeleted={() => handleTrainerDeleted(trainer.id)} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl active:scale-95 transition-all duration-120 touch-manipulation"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Add Modal */}
      <AddTrainerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleTrainerAdded}
      />
    </div>
  );
}
