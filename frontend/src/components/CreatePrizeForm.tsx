import React, { useState, useMemo } from 'react';
import api from '../lib/api';
import type { Prize } from '../types';

interface CreatePrizeFormProps {
    rouletteId: string;
    onClose: () => void;
    onPrizeCreated: (newPrize: Prize) => void;
    currentTotalWeight: number;
}

const initialState = {
    name: '',
    win_message: 'Congratulations!',
    stock: 10,
    weight: 10,
};

const CreatePrizeForm: React.FC<CreatePrizeFormProps> = ({
    rouletteId,
    onClose,
    onPrizeCreated,
    currentTotalWeight
}) => {

    const [formData, setFormData] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = parseInt(value, 10);

        setFormData(prev => ({
            ...prev,
            [name]: (name === 'stock' || name === 'weight') ? (isNaN(numValue) ? 0 : numValue) : value,
        }));
    };

    const newProbability = useMemo(() => {
        const newWeight = formData.weight || 0;
        if (newWeight <= 0) return 0;
        const newTotalWeight = currentTotalWeight + newWeight;
        return (newWeight / newTotalWeight) * 100;
    }, [formData.weight, currentTotalWeight]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const stockValue = parseInt(formData.stock.toString(), 10);
            const weightValue = parseInt(formData.weight.toString(), 10);
            if (isNaN(weightValue) || weightValue < 0) {
                throw new Error("Weight must be a non-negative number.");
            }
            const updateData = {
                name: formData.name,
                win_message: formData.win_message,
                stock: stockValue,
                weight: weightValue,
            };

            const response = await api.post<Prize>(
                `/roulettes/${rouletteId}/prizes`,
                updateData
            );
            onPrizeCreated(response.data);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Creation failed');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. 奖品名称 */}
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
                    />
                </div>

                {/* 2. 中奖语 */}
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
                    />
                </div>

                {/* 3. 库存 */}
                <div>
                    <label htmlFor="prize-stock" className="block text-sm font-medium text-gray-700 mb-1">Inventory (0 = Out of stock)</label>
                    <input
                        type="number"
                        name="stock"
                        id="prize-stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Stock (leave blank for unlimited)"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {/* 4. 权重 */}
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
                    />
                    <p className="text-sm text-blue-600 font-medium mt-2">
                        Probability: {newProbability.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        (Based on total weight {currentTotalWeight} + {formData.weight || 0})
                    </p>
                </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                    {isLoading ? 'Adding...' : 'Add Prize'}
                </button>
            </div>
        </form>
    );
};

export default CreatePrizeForm;