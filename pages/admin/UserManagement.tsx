import React, { useEffect, useState } from 'react';
import { getUsers, updateUser, deleteUser, createUser } from '../../services/adminService';
import { 
    Search as SearchIcon, 
    Filter, 
    MoreVertical, 
    UserX, 
    Shield, 
    Edit, 
    Trash2,
    ChevronLeft, 
    ChevronRight,
    AlertCircle,
    UserPlus,
    X,
    Save,
    Trash,
    UserCheck
} from 'lucide-react';
import { Button, Input, Modal, Select } from '../../components/ui';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmUnbanId, setConfirmUnbanId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        branch: '',
        year: '1',
        college: '',
        role: 'user'
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers(page, search);
            if (data.success) {
                const normalizedUsers = data.users.map((u: any) => ({
                    ...u,
                    id: u._id || u.id
                }));
                setUsers(normalizedUsers);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const handleUpdateStatus = async (id: string, updates: any) => {
        try {
            const data = await updateUser(id, updates);
            if (data.success) {
                setUsers(users.map(u => u.id === id ? { ...data.user, id: data.user._id } : u));
            }
        } catch (error) {
            console.error('Update failed');
        }
    };

    const handleDeleteUser = async () => {
        if (!confirmDeleteId) return;
        setFormLoading(true);
        try {
            const data = await deleteUser(confirmDeleteId);
            if (data.success) {
                setUsers(users.filter(u => u.id !== confirmDeleteId));
                setConfirmDeleteId(null);
            }
        } catch (error) {
            console.error('Delete failed');
            alert('Deletion failed. Please ensure the backend server has been RESTARTED to include the new routes.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const data = await createUser(formData);
            if (data.success) {
                setIsAddModalOpen(false);
                fetchUsers();
                resetForm();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setFormLoading(true);
        try {
            const data = await updateUser(selectedUser.id, formData);
            if (data.success) {
                setIsEditModalOpen(false);
                setUsers(users.map(u => u.id === selectedUser.id ? { ...data.user, id: data.user._id } : u));
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update user');
        } finally {
            setFormLoading(false);
        }
    };

    const openEditModal = (user: any) => {
        setSelectedUser(user);
        setFormData({
            displayName: user.displayName || '',
            email: user.email || '',
            password: '', 
            branch: user.branch || '',
            year: String(user.year || '1'),
            college: user.college || '',
            role: user.role || 'user'
        });
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            displayName: '',
            email: '',
            password: '',
            branch: '',
            year: '1',
            college: '',
            role: 'user'
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">User Directory</h1>
                    <p className="text-xs text-slate-500 font-medium">Manage user permissions, roles, and platform access.</p>
                </div>

                <div className="flex items-center gap-3">
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative group">
                            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                            <input
                                id="user-search"
                                name="search"
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-[#0A0C10] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 w-48 lg:w-64 transition-all"
                            />
                        </div>
                    </form>
                    
                    <Button 
                        onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                        className="flex items-center gap-2 !h-9 px-4"
                        variant="primary"
                    >
                        <UserPlus size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Add User</span>
                    </Button>
                </div>
            </div>

            <div className="bg-[#0A0C10] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">User</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Academics</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Active</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-8 h-12 bg-white/[0.01]" />
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500 italic text-xs">No users found.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-white/10 uppercase">
                                                    {user.displayName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors">{user.displayName}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{user.branch || 'N/A'} • {user.year ? `Year ${user.year}` : 'N/A'}</p>
                                            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">{user.college || 'N/A'}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                                user.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                                                user.role === 'superadmin' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' :
                                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            }`}>
                                                {user.role === 'superadmin' && <Shield size={10} />}
                                                {user.role}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className={`inline-flex h-2 w-2 rounded-full mr-2 ${
                                                user.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                user.status === 'banned' ? 'bg-rose-500' : 'bg-slate-500'
                                            }`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                                user.status === 'active' ? 'text-emerald-500' :
                                                user.status === 'banned' ? 'text-rose-500' : 'text-slate-500'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                                {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                                            </p>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => openEditModal(user)}
                                                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-blue-400 transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(user.id, { role: user.role === 'admin' ? 'user' : 'admin' })}
                                                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-violet-400 transition-colors"
                                                    title="Toggle Admin"
                                                >
                                                    <Shield size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (user.status === 'banned') {
                                                            setConfirmUnbanId(user.id);
                                                        } else {
                                                            handleUpdateStatus(user.id, { status: 'banned' });
                                                        }
                                                    }}
                                                    className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors ${user.status === 'banned' ? 'text-emerald-500' : 'text-slate-500 hover:text-rose-500'}`}
                                                    title={user.status === 'banned' ? 'Restore Access (Unban)' : 'Revoke Access (Ban)'}
                                                >
                                                    {user.status === 'banned' ? <UserCheck size={14} /> : <UserX size={14} />}
                                                </button>
                                                <button 
                                                    onClick={() => setConfirmDeleteId(user.id)}
                                                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-1">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
                title={isAddModalOpen ? "Register New Academic" : "Modify User Profile"}
            >
                <form onSubmit={isAddModalOpen ? handleAddUser : handleEditUser} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="user-display-name" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                            <Input 
                                id="user-display-name"
                                name="displayName"
                                required
                                value={formData.displayName}
                                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                                placeholder="John Doe"
                                className="!bg-black/20 !border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="user-email" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                            <Input 
                                id="user-email"
                                name="email"
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="john@example.com"
                                className="!bg-black/20 !border-white/10"
                            />
                        </div>
                    </div>

                    {isAddModalOpen && (
                        <div className="space-y-2">
                            <label htmlFor="user-password" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initial Password</label>
                            <Input 
                                id="user-password"
                                name="password"
                                required
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                placeholder="••••••••"
                                className="!bg-black/20 !border-white/10"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="user-branch" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Branch</label>
                            <Input 
                                id="user-branch"
                                name="branch"
                                value={formData.branch}
                                onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                placeholder="Computer Engineering"
                                className="!bg-black/20 !border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="user-year" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Year</label>
                            <Select 
                                id="user-year"
                                name="year"
                                value={formData.year}
                                onChange={(e) => setFormData({...formData, year: e.target.value})}
                                className="!bg-black/20 !border-white/10"
                            >
                                <option value="1">First Year</option>
                                <option value="2">Second Year</option>
                                <option value="3">Third Year</option>
                                <option value="4">Fourth Year</option>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="user-college" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">College / Institution</label>
                        <Input 
                            id="user-college"
                            name="college"
                            value={formData.college}
                            onChange={(e) => setFormData({...formData, college: e.target.value})}
                            placeholder="Mumbai University"
                            className="!bg-black/20 !border-white/10"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button 
                            type="button"
                            variant="ghost" 
                            onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
                            className="text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            isLoading={formLoading}
                            variant="primary"
                            className="px-8 flex items-center gap-2"
                        >
                            <Save size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                {isAddModalOpen ? "Create Account" : "Save Changes"}
                            </span>
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Confirm Data Erasure"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                        <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-rose-200 uppercase tracking-widest">Irreversible Action</p>
                            <p className="text-[11px] text-rose-300/60 font-medium">
                                This will permanently purge the user account and all associated neural data from the NexusAI mainframe.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button 
                            type="button"
                            variant="ghost" 
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] font-bold uppercase tracking-widest"
                        >
                            Abort
                        </Button>
                        <Button 
                            onClick={handleDeleteUser}
                            isLoading={formLoading}
                            variant="danger"
                            className="px-8 flex items-center gap-2 bg-rose-600 hover:bg-rose-700 border-none"
                        >
                            <Trash size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Execute Deletion</span>
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* Unban Confirmation Modal */}
            <Modal
                isOpen={!!confirmUnbanId}
                onClose={() => setConfirmUnbanId(null)}
                title="Restore Account Access"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Access Restoration</p>
                            <p className="text-[11px] text-emerald-300/60 font-medium">
                                This will lift all administrative restrictions and allow the user to log back into the NexusAI platform.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button 
                            type="button"
                            variant="ghost" 
                            onClick={() => setConfirmUnbanId(null)}
                            className="text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={async () => {
                                if (confirmUnbanId) {
                                    await handleUpdateStatus(confirmUnbanId, { status: 'active' });
                                    setConfirmUnbanId(null);
                                }
                            }}
                            variant="primary"
                            className="px-8 bg-emerald-600 hover:bg-emerald-700 border-none"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Unban User</span>
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UserManagement;
