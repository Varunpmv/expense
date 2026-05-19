'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { upsertUser, upsertDropdownConfig, toggleDropdownConfig, deleteDropdownConfig } from '@/app/actions/admin';
import { Edit2, Save, X as CloseIcon, Trash2 } from 'lucide-react';

export default function AdminDashboardClient({ 
  initialUsers,
  initialConfigs,
  initialCustomFields,
  initialSmtpSettings,
  initialSettings
}: { 
  initialUsers: any[], 
  initialConfigs: any[],
  initialCustomFields: any[],
  initialSmtpSettings: any,
  initialSettings: any[]
}) {
  const [activeTab, setActiveTab] = useState<'users' | 'configs' | 'fields' | 'smtp'>('users');
  const [activeConfigTab, setActiveConfigTab] = useState<'ACCOUNT' | 'EXPENSE_HEAD' | 'EXPENSE_TYPE' | 'DEPARTMENT'>('ACCOUNT');
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [tempHeading, setTempHeading] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const departments = initialConfigs.filter(c => c.type === 'DEPARTMENT' && c.isActive).map(c => c.value);

  const handleUserSubmit = async (formData: FormData) => {
    await upsertUser(formData);
    setShowUserModal(false);
    setEditingItem(null);
  };

  const handleConfigSubmit = async (formData: FormData) => {
    await upsertDropdownConfig(formData);
    setShowConfigModal(false);
    setEditingItem(null);
  };

  const handleSmtpSubmit = async (formData: FormData) => {
    const { saveSmtpSettings } = await import('@/app/actions/admin');
    await saveSmtpSettings(formData);
    alert('SMTP settings saved successfully!');
  };

  const handleFieldSubmit = async (formData: FormData) => {
    const { upsertCustomField } = await import('@/app/actions/admin');
    await upsertCustomField(formData);
    setShowFieldModal(false);
    setEditingItem(null);
  };

  const handleHeadingUpdate = async () => {
    const { updateDropdownHeading } = await import('@/app/actions/admin');
    await updateDropdownHeading(activeConfigTab, tempHeading);
    setIsEditingHeading(false);
  };

  const getHeading = (type: string) => {
    const setting = initialSettings.find(s => s.key === `heading_${type}`);
    return setting?.value || `${type.replace('_', ' ')}s`;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600">
              Admin Panel
            </h1>
            <p className="text-slate-500 font-medium italic">Configure system-wide settings, users, and dropdown options.</p>
          </div>
          
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl backdrop-blur-md border border-white/50 shadow-inner">
            {[
              { id: 'users', label: 'Users' },
              { id: 'configs', label: 'Dropdowns' },
              { id: 'fields', label: 'Custom Fields' },
              { id: 'smtp', label: 'SMTP Config' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-white text-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.15)] scale-[1.02]' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      {activeTab === 'users' ? (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-5 border-b border-slate-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg font-medium text-slate-900">Registered Users</h3>
            <Button variant="primary" onClick={() => { setEditingItem(null); setShowUserModal(true); }}>Add User</Button>
          </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {initialUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.department || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setEditingItem(user); setShowUserModal(true); }} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'configs' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-wrap gap-3 p-2 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl w-fit backdrop-blur-sm shadow-sm">
              {[
                { id: 'ACCOUNT', label: 'Accounts' },
                { id: 'EXPENSE_HEAD', label: 'Expense Heads' },
                { id: 'EXPENSE_TYPE', label: 'Expense Types' },
                { id: 'DEPARTMENT', label: 'Departments' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveConfigTab(tab.id as any);
                    setIsEditingHeading(false);
                  }}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    activeConfigTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                      : 'text-indigo-400 hover:bg-white hover:text-indigo-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] border border-slate-200/60 overflow-hidden max-w-4xl animate-in zoom-in-95 duration-500">
              <div className="px-10 py-10 border-b border-slate-100 bg-gradient-to-br from-slate-50/50 to-white">
                <div className="flex justify-between items-center">
                  <div className="flex-1 mr-8">
                    {isEditingHeading ? (
                      <div className="flex items-center gap-4">
                        <input 
                          type="text" 
                          value={tempHeading} 
                          onChange={(e) => setTempHeading(e.target.value)}
                          className="text-3xl font-black text-slate-900 border-b-4 border-indigo-600 bg-transparent focus:outline-none py-1 px-2 w-full max-w-md placeholder-slate-300 transition-all"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleHeadingUpdate()}
                        />
                        <div className="flex gap-2">
                          <button onClick={handleHeadingUpdate} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 shadow-md">SAVE</button>
                          <button onClick={() => setIsEditingHeading(false)} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-300">CANCEL</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                          {getHeading(activeConfigTab)}
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-black ring-4 ring-indigo-50">
                            {initialConfigs.filter(c => c.type === activeConfigTab).length}
                          </span>
                        </h3>
                        <button 
                          onClick={() => {
                            setTempHeading(getHeading(activeConfigTab));
                            setIsEditingHeading(true);
                          }}
                          className="p-2 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110 group border border-transparent hover:border-indigo-100"
                        >
                          <Edit2 className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-slate-500 mt-3 font-medium">Fine-tune available options for <span className="text-indigo-600 font-bold">{getHeading(activeConfigTab).toLowerCase()}</span>.</p>
                  </div>
                  <button 
                    onClick={() => { setEditingItem({ type: activeConfigTab }); setShowConfigModal(true); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all active:scale-95"
                  >
                    <span className="text-xl leading-none">+</span>
                    ADD {getHeading(activeConfigTab).replace(/s$/, '').toUpperCase()}
                  </button>
                </div>
              </div>
              
              <div className="px-10 py-6 bg-white/50">
                <table className="w-full divide-y divide-slate-100">
                  <thead className="bg-transparent">
                    <tr>
                      <th className="pb-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Option Detail</th>
                      <th className="pb-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] w-px whitespace-nowrap px-12">Lifecycle</th>
                      <th className="pb-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] w-px whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {initialConfigs.filter(c => c.type === activeConfigTab).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center">
                              <span className="text-2xl opacity-20">📂</span>
                            </div>
                            <p className="text-slate-400 font-bold italic">No entries discovered in this category.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      initialConfigs.filter(c => c.type === activeConfigTab).map((config) => (
                        <tr key={config.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                          <td className="py-6">
                            <div className="flex flex-col">
                              <span className={`text-base font-bold tracking-tight ${!config.isActive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{config.value}</span>
                              {activeConfigTab === 'EXPENSE_HEAD' && config.approverEmail && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                                  <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">Approver: {config.approverEmail}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-6 text-center px-12">
                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                              config.isActive 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                              {config.isActive ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td className="py-6 text-right">
                            <div className="flex justify-end gap-3 items-center opacity-40 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setEditingItem(config); setShowConfigModal(true); }}
                                className="bg-white border border-slate-200 text-[10px] font-black uppercase px-3 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all active:scale-95"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => toggleDropdownConfig(config.id, !config.isActive)}
                                className={`text-[10px] font-black uppercase px-3 py-2 rounded-xl shadow-sm transition-all active:scale-95 border ${
                                  config.isActive 
                                    ? 'bg-white border-rose-100 text-rose-500 hover:bg-rose-50' 
                                    : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 shadow-indigo-100'
                                }`}
                              >
                                {config.isActive ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Permanently remove this entry? This action is irreversible.')) {
                                    deleteDropdownConfig(config.id);
                                  }
                                }}
                                className="p-2 hover:bg-rose-100 rounded-xl transition-all group/del border border-transparent hover:border-rose-200"
                                title="Permanent Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-slate-300 group-hover/del:text-rose-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'fields' ? (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-5 border-b border-slate-200 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-slate-900">Custom Submission Fields</h3>
              <p className="text-sm text-slate-500">Add dynamic fields to the expense submission form.</p>
            </div>
            <Button variant="primary" onClick={() => { setEditingItem(null); setShowFieldModal(true); }}>Add Field</Button>
          </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Label</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Required</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {initialCustomFields.map((field) => (
                <tr key={field.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{field.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{field.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{field.required ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <button 
                      onClick={async () => {
                        const { toggleCustomField } = await import('@/app/actions/admin');
                        await toggleCustomField(field.id, !field.isActive);
                      }}
                      className={`px-2 py-1 rounded text-xs font-bold ${field.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {field.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setEditingItem(field); setShowFieldModal(true); }} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-xl border border-slate-200 p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">SMTP Alert Configuration</h3>
          <p className="text-sm text-slate-500 mb-8">Configure your SMTP server to enable automated email alerts for submissions and approvals.</p>
          
          <form action={handleSmtpSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">SMTP Host</label>
                <input type="text" name="host" defaultValue={initialSmtpSettings?.host} required placeholder="smtp.gmail.com" className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Port</label>
                <input type="number" name="port" defaultValue={initialSmtpSettings?.port} required placeholder="587" className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input type="text" name="user" defaultValue={initialSmtpSettings?.user} required className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input type="password" name="pass" defaultValue={initialSmtpSettings?.pass} required className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">From Email Address</label>
              <input type="email" name="from" defaultValue={initialSmtpSettings?.from} required placeholder="alerts@yourcompany.com" className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            <div className="flex items-center">
              <input type="checkbox" name="secure" id="secure" defaultChecked={initialSmtpSettings?.secure} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
              <label htmlFor="secure" className="ml-2 block text-sm text-slate-700 font-medium">Use Secure Connection (SSL/TLS)</label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary">Save Configuration</Button>
            </div>
          </form>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold mb-6">{editingItem ? 'Edit User' : 'Add New User'}</h2>
            <form action={handleUserSubmit} className="space-y-4">
              {editingItem && <input type="hidden" name="id" value={editingItem.id} />}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                <input type="text" name="name" defaultValue={editingItem?.name} required className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input type="email" name="email" defaultValue={editingItem?.email} required className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select name="role" defaultValue={editingItem?.role || 'EMPLOYEE'} className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="FINANCE">Finance Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                <select name="department" defaultValue={editingItem?.department || ''} className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <Button type="button" variant="outline" onClick={() => setShowUserModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold mb-6">{editingItem?.id ? 'Edit' : 'Add'} {editingItem?.type?.replace('_', ' ')}</h2>
            <form action={handleConfigSubmit} className="space-y-4">
              {editingItem?.id && <input type="hidden" name="id" value={editingItem.id} />}
              <input type="hidden" name="type" value={editingItem?.type} />
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Value</label>
                <input type="text" name="value" defaultValue={editingItem?.value} required placeholder="Enter option value..." className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              
              {editingItem?.type === 'EXPENSE_HEAD' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Designated Approver (Manager)</label>
                  <select name="approverEmail" defaultValue={editingItem?.approverEmail || ''} className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">No specific approver (All Managers)</option>
                    {initialUsers.filter(u => u.role === 'MANAGER').map(u => (
                      <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-8">
                <Button type="button" variant="outline" onClick={() => setShowConfigModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editingItem?.id ? 'Update' : 'Add'} Option</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold mb-6">{editingItem?.id ? 'Edit Field' : 'Add Custom Field'}</h2>
            <form action={handleFieldSubmit} className="space-y-4">
              {editingItem?.id && <input type="hidden" name="id" value={editingItem.id} />}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Field Label</label>
                <input type="text" name="name" defaultValue={editingItem?.name} required placeholder="e.g., Project Code" className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Field Type</label>
                <select 
                  name="type" 
                  defaultValue={editingItem?.type || 'TEXT'} 
                  className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                  onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                >
                  <option value="TEXT">Text Field</option>
                  <option value="SELECT">Dropdown Select</option>
                </select>
              </div>
              
              {(editingItem?.type === 'SELECT') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Options (Comma separated)</label>
                  <input type="text" name="options" defaultValue={editingItem?.options} placeholder="Option 1, Option 2, Option 3" className="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              )}

              <div className="flex items-center">
                <input type="checkbox" name="required" id="required" defaultChecked={editingItem?.required} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
                <label htmlFor="required" className="ml-2 block text-sm text-slate-700 font-medium">Mark as Required</label>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <Button type="button" variant="outline" onClick={() => setShowFieldModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Field</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
