import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAssignments, addAssignment, updateAssignment, deleteAssignment } from '../services/assignmentService';
import { type Assignment } from '../types';
import { PageHeader, Button, Input, Textarea, Select } from '../components/ui';
import { PlusCircle, Trash2, Edit } from 'lucide-react';

const Assignments: React.FC = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (currentUser) {
      getAssignments(currentUser.uid).then(setAssignments);
    }
  }, [currentUser]);

  const handleAddAssignment = async () => {
    if (currentUser && newAssignment.title) {
      const assignmentToAdd = { ...newAssignment, userId: currentUser.uid, status: 'To Do' as const };
      const added = await addAssignment(assignmentToAdd);
      if (added) {
        setAssignments([...assignments, added]);
      }
      setNewAssignment({ title: '', description: '', dueDate: '' });
      setIsAdding(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Assignment['status']) => {
    await updateAssignment(id, { status });
    setAssignments(assignments.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleDelete = async (id: string) => {
    await deleteAssignment(id);
    setAssignments(assignments.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Assignments" subtitle="Manage your tasks and assignments." />

      <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700">
        <Button onClick={() => setIsAdding(!isAdding)} className="mb-4">
          <PlusCircle size={16} className="mr-2" />
          {isAdding ? 'Cancel' : 'Add Assignment'}
        </Button>

        {isAdding && (
          <div className="space-y-4 p-4 bg-slate-800 rounded-lg">
            <Input
              placeholder="Title" 
              value={newAssignment.title}
              onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={newAssignment.description}
              onChange={e => setNewAssignment({ ...newAssignment, description: e.target.value })}
            />
            <Input
              type="date"
              value={newAssignment.dueDate}
              onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
            />
            <Button onClick={handleAddAssignment}>Add</Button>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {assignments.map(assignment => (
            <div key={assignment.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
              <div>
                <p className="font-bold">{assignment.title}</p>
                <p className="text-sm text-slate-400">{assignment.description}</p>
                <p className="text-xs text-slate-500">Due: {assignment.dueDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={assignment.status}
                  onChange={e => handleUpdateStatus(assignment.id, e.target.value as Assignment['status'])}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(assignment.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Assignments;
