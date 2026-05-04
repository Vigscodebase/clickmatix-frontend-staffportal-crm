import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ title, value, subtext, icon, trend, color }) {
    const Icon = icon;

    return (
        <div className="bg-white p-6 rounded-2xl border border-blue-50 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>

            {subtext && (
                <div className="flex items-center gap-2 text-sm">
                    {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-green-500" />}
                    {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
                    <span className="text-gray-400">{subtext}</span>
                </div>
            )}
        </div>
    );
}
