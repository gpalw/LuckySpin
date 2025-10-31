// frontend/src/pages/UserManagement.tsx
import React, { useState } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';

type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

const UserManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('OPERATOR');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.post('/users', { username, password, role });
            setSuccess(`User ${username} created successfully! Role: ${role}`);
            setUsername('');
            setPassword('');
            setIsModalOpen(false); // 创建成功后关闭
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create user.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">User Management</h1>

            {success && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md">{success}</div>}
            {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}

            <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 text-lg font-bold text-white bg-green-600 rounded-md hover:bg-green-700"
            >
                + Create New User
            </button>

            {/* 创建用户弹窗 */}
            <Modal
                title="Create New User Account"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select value={role} onChange={e => setRole(e.target.value as UserRole)} required className="w-full px-3 py-2 border rounded-md">
                            <option value="OPERATOR">OPERATOR (Field Staff)</option>
                            <option value="ADMIN">ADMIN (Full Access)</option>
                            <option value="VIEWER">VIEWER (View Only)</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <button type="submit" disabled={isLoading} className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                            {isLoading ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;