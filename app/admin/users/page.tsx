"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/data/mockData';
import { Search, Eye, Ban, Trash2, X } from 'lucide-react';

type RoleFilter = 'all' | 'customer' | 'owner' | 'delivery';

export default function AdminUsersPage() {
  const { usersList, updateUserStatus } = useAuth();
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Toggle Ban Status
  const handleToggleBan = (user: User) => {
    const isCurrentlyBanned = user.status === 'Banned';
    const nextStatus = isCurrentlyBanned ? 'Active' : 'Banned';
    
    if (confirm(`Are you sure you want to ${isCurrentlyBanned ? 'Unban' : 'Ban'} user "${user.name}"?`)) {
      updateUserStatus(user.id, nextStatus as any);
      alert(`User "${user.name}" status updated to: ${nextStatus}`);
      // Refresh dynamic overlay state
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...user, status: nextStatus as any });
      }
    }
  };

  // Delete User
  const handleDeleteUser = (userId: string) => {
    if (confirm("Permanently delete this user account?")) {
      updateUserStatus(userId, 'Banned');
      alert("User account deleted/banned successfully.");
    }
  };

  // Filter Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      
      let matchesRole = true;
      if (roleFilter !== 'all') matchesRole = u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [usersList, searchQuery, roleFilter]);

  return (
    <div className="space-y-6 text-slate-300">
      
      {/* Header */}
      <section className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-5 rounded-[2rem] border border-slate-800 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-display">Manage Users</h1>
          <p className="text-xs text-slate-500 font-semibold font-sans">Inspect registered accounts, verify roles, and apply system bans.</p>
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name or Email..."
            className="w-full rounded-full bg-slate-900 border border-slate-800 py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:border-primary outline-none"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Role filters */}
        <div className="flex gap-1.5 overflow-x-auto max-w-full hide-scrollbar py-1">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'customer', label: 'Customers' },
            { id: 'owner', label: 'Store Partners' },
            { id: 'delivery', label: 'Riders' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${
                roleFilter === tab.id
                  ? 'bg-primary text-white border-primary shadow-sm font-black'
                  : 'bg-slate-900 text-slate-500 hover:bg-slate-800 border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Table grid */}
      <section className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-350 font-semibold">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-900/35 transition-colors">
                    <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center font-extrabold text-primary shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span>{user.name}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-400">{user.email}</td>
                    <td className="py-4 px-4 font-sans text-slate-400">{user.phone}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        user.role === 'admin' ? 'bg-amber-950/20 text-amber-400 border-amber-900/50' :
                        user.role === 'owner' ? 'bg-indigo-950/20 text-indigo-400 border-indigo-900/50' :
                        user.role === 'delivery' ? 'bg-blue-950/20 text-blue-400 border-blue-900/50' :
                        'bg-slate-950 text-slate-500 border-slate-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        user.status === 'Active' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50' :
                        user.status === 'Banned' ? 'bg-rose-950/20 text-rose-400 border-rose-900/50' :
                        'bg-amber-950/20 text-amber-400 border-amber-900/50'
                      }`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="bg-slate-850 hover:bg-slate-800 text-white p-2 rounded-full flex hover:text-primary transition-all active:scale-90"
                          title="View Profile Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleToggleBan(user)}
                          className={`p-2 rounded-full flex transition-all active:scale-90 ${
                            user.status === 'Banned'
                              ? 'bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300'
                              : 'bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                          }`}
                          title={user.status === 'Banned' ? 'Unban User' : 'Ban User'}
                        >
                          <Ban size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-950/20 hover:bg-red-950/40 text-red-400 p-2 rounded-full flex hover:text-red-300 transition-all active:scale-90"
                          title="Delete User Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-3 bg-slate-950/30 rounded-[2rem] p-4 text-[10px] text-slate-500 font-semibold">
            <span className="text-5xl block animate-float">👥</span>
            <p className="text-slate-400">No users found matching active filters.</p>
          </div>
        )}
      </section>

      {/* DETAIL VIEW MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-6 max-w-md w-full glass-card-dark text-slate-350 space-y-5 relative animate-all">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute right-6 top-6 text-slate-500 hover:text-slate-300"
            >
              <X size={16} />
            </button>
            
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">Client Account Card</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Auditing profile constraints from database registers.</p>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center text-xl font-extrabold text-primary overflow-hidden shrink-0">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-white leading-none">{selectedUser.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{selectedUser.email}</p>
                  <span className="bg-primary-fixed text-primary px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider inline-block">
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-[2rem] border border-slate-850">
                <div>
                  <p className="text-[8px] text-slate-600 uppercase block tracking-wider mb-0.5">Contact Phone</p>
                  <p className="text-white font-extrabold font-mono">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-600 uppercase block tracking-wider mb-0.5">Account Status</p>
                  <p className={`font-extrabold ${selectedUser.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedUser.status || 'Active'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[8px] text-slate-600 uppercase block tracking-wider mb-0.5">Physical Address Location</p>
                  <p className="text-white font-semibold leading-relaxed font-sans">{selectedUser.address}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedUser(null)}
              className="btn-primary w-full py-2.5 rounded-full text-xs font-bold shadow-glow"
            >
              Dismiss client details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
