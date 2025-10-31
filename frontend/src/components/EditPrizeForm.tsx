import React, { useState, useEffect } from 'react';
import type { Prize } from '../types';
import api from '../lib/api';
import Modal from './Modal';

interface EditPrizeFormProps {
    prize: Prize | null;
    onClose: () => void;
    onPrizeUpdated: (updatedPrize: Prize) => void;
    onPrizeDeleted: (prizeId: string) => void;
}

const EditPrizeForm: React.FC<EditPrizeFormProps> = ({
    prize,
    onClose,
    onPrizeUpdated,
    onPrizeDeleted
}) => {

    const [formData, setFormData] = useState({
        name: prize?.name || '',
        win_message: prize?.win_message || '',
        stock: prize?.stock === null ? '' : prize?.stock?.toString() || '',
        weight: prize?.weight?.toString() || '1',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (prize) {
            setFormData({
                name: prize.name,
                win_message: prize.win_message,
                stock: prize.stock === null ? '' : prize.stock.toString(),
                weight: prize.weight.toString(),
            });
        }
    }, [prize]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prize) return;

        setIsSaving(true);
        setError(null);
        try {
            const stockValue = parseInt(formData.stock.toString(), 10);
            const weightValue = parseInt(formData.weight.toString(), 10);
            // 构造发送给后端的数据，处理 stock 字段的 null 状态
            const updateData = {
                name: formData.name,
                win_message: formData.win_message,
                stock: formData.stock === '' ? null : stockValue,
                weight: formData.weight === '' ? null : weightValue,
            };

            const response = await api.patch<Prize>(`/prizes/${prize.id}`, updateData);
            onPrizeUpdated(response.data);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Update failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!prize) return;
        setIsConfirmingDelete(false);

        setIsSaving(true);
        try {
            await api.delete(`/prizes/${prize.id}`);
            onPrizeDeleted(prize.id);
            onClose();
        } catch (error: any) {
            setError(error.response?.data?.message || error.message || 'Deletion failed');
        } finally {
            setIsSaving(false);
        }
    };

    if (!prize) return null;

    return (
        <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* 1. Prize Name */}
                <div>
                    <label htmlFor="prize-name" className="block text-sm font-medium text-gray-700 mb-1">Prize Name</label>
                    <input
                        type="text"
                        name="name"
                        id="prize-name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., First Prize"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={isSaving}
                    />
                </div>

                {/* 2. Winning Message */}
                <div>
                    <label htmlFor="prize-win-msg" className="block text-sm font-medium text-gray-700 mb-1">Winning Message</label>
                    <input
                        type="text"
                        name="win_message"
                        id="prize-win-msg"
                        value={formData.win_message}
                        onChange={handleChange}
                        placeholder="e.g., Congratulations! You won!"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={isSaving}
                    />
                </div>

                {/* 3. Stock/Inventory */}
                <div>
                    <label htmlFor="prize-stock" className="block text-sm font-medium text-gray-700 mb-1">Inventory (0 = Out of stock)</label>
                    <input
                        type="number"
                        name="stock"
                        id="prize-stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Stock (e.g., 10)"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={isSaving}
                    />
                </div>

                {/* 4. Weight */}
                <div>
                    <label htmlFor="prize-weight" className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                    <input
                        type="number"
                        name="weight"
                        id="prize-weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="Weight (e.g., 10)"
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={isSaving}
                    />
                </div>
            </div>

            {/* 底部按钮 (Delete + Cancel + Save) */}
            <div className="flex justify-between items-center gap-4 pt-4 border-t mt-6">
                <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                    disabled={isSaving}
                >
                    Delete Prize
                </button>
                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* 删除确认弹窗 */}
            <Modal
                title="Confirm Deletion"
                isOpen={isConfirmingDelete}
                onClose={() => setIsConfirmingDelete(false)}
            >
                <p className="text-gray-700">Are you sure you want to delete the prize "{prize?.name}"?</p>
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                        disabled={isSaving}
                    >
                        Confirm Delete
                    </button>
                </div>
            </Modal>
        </form>
    );
};

export default EditPrizeForm;