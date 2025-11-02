import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';

// Тестовые данные для демонстрации
const generateDailyData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        data.push({
            date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
            fullDate: date.toLocaleDateString('ru-RU'),
            defects: Math.floor(Math.random() * 15) + 2, // от 2 до 16 дефектов
            scratch: Math.floor(Math.random() * 6) + 1,
            dent: Math.floor(Math.random() * 4) + 1,
            runs: Math.floor(Math.random() * 3) + 1,
            bubbling: Math.floor(Math.random() * 3) + 1,
        });
    }
    
    return data;
};

const generateMonthlyData = () => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const data = [];
    
    for (let i = 0; i < 12; i++) {
        data.push({
            month: months[i],
            defects: Math.floor(Math.random() * 200) + 50, // от 50 до 249 дефектов
            inspections: Math.floor(Math.random() * 100) + 30, // от 30 до 129 проверок
            avgDefectsPerInspection: (Math.random() * 3 + 1).toFixed(1), // от 1.0 до 4.0
        });
    }
    
    return data;
};

// Данные для гистограммы по классам дефектов за сегодня
const generateTodayDefectsData = () => {
    return [
        { class: 'Царапины', count: Math.floor(Math.random() * 15) + 5, color: '#f59e0b' },
        { class: 'Вмятины', count: Math.floor(Math.random() * 10) + 3, color: '#3b82f6' },
        { class: 'Потеки', count: Math.floor(Math.random() * 8) + 2, color: '#10b981' },
        { class: 'Пузыри', count: Math.floor(Math.random() * 6) + 1, color: '#8b5cf6' },
    ];
};

// Данные для отдельных гистограмм по каждому классу (по часам)
const generateHourlyDefectsData = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
        hours.push({
            hour: `${i.toString().padStart(2, '0')}:00`,
            scratch: Math.floor(Math.random() * 3),
            dent: Math.floor(Math.random() * 2),
            runs: Math.floor(Math.random() * 2),
            bubbling: Math.floor(Math.random() * 1),
        });
    }
    return hours;
};

const DashboardPage: React.FC = () => {
    const dailyData = generateDailyData();
    const monthlyData = generateMonthlyData();
    const todayDefectsData = generateTodayDefectsData();
    const hourlyData = generateHourlyDefectsData();

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold mb-6 text-white">Аналитический дашборд</h1>

            {/* Статистика за последние 30 дней */}
            <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Динамика дефектов за последние 30 дней</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="date" stroke="#ccc" />
                        <YAxis stroke="#ccc" />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} 
                            labelStyle={{ color: '#fff' }}
                            formatter={(value, name) => [value, name === 'defects' ? 'Всего дефектов' : name]}
                        />
                        <Legend wrapperStyle={{ color: '#fff' }} />
                        <Line 
                            type="monotone" 
                            dataKey="defects" 
                            stroke="#ef4444" 
                            strokeWidth={3}
                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                            name="Всего дефектов"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Типы дефектов по дням */}
            <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Типы дефектов по дням</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="date" stroke="#ccc" />
                        <YAxis stroke="#ccc" />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} 
                            labelStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ color: '#fff' }} />
                        <Line 
                            type="monotone" 
                            dataKey="scratch" 
                            stroke="#f59e0b" 
                            strokeWidth={3}
                            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                            name="Царапины"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="dent" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            name="Вмятины"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="runs" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            name="Потеки"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="bubbling" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                            name="Пузыри"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Месячная статистика */}
            <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Статистика по месяцам</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="month" stroke="#ccc" />
                        <YAxis yAxisId="left" stroke="#ccc" />
                        <YAxis yAxisId="right" orientation="right" stroke="#ccc" />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} 
                            labelStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ color: '#fff' }} />
                        <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="defects" 
                            stroke="#ef4444" 
                            strokeWidth={3}
                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                            name="Всего дефектов"
                        />
                        <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="inspections" 
                            stroke="#06d6a0" 
                            strokeWidth={3}
                            dot={{ fill: '#06d6a0', strokeWidth: 2, r: 5 }}
                            name="Количество проверок"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Гистограмма дефектов за сегодня по классам */}
            <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Распределение дефектов за сегодня по классам</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={todayDefectsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="class" stroke="#ccc" />
                        <YAxis stroke="#ccc" />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} 
                            labelStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ color: '#fff' }} />
                        <Bar 
                            dataKey="count" 
                            name="Количество дефектов"
                            radius={[4, 4, 0, 0]}
                        >
                            {todayDefectsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Гистограммы по часам для каждого класса отдельно */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Царапины по часам */}
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-white">Царапины по часам</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="hour" stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} 
                                labelStyle={{ color: '#fff' }}
                            />
                            <Bar 
                                dataKey="scratch" 
                                fill="#f59e0b" 
                                name="Царапины"
                                radius={[2, 2, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Вмятины по часам */}
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-white">Вмятины по часам</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="hour" stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} 
                                labelStyle={{ color: '#fff' }}
                            />
                            <Bar 
                                dataKey="dent" 
                                fill="#3b82f6" 
                                name="Вмятины"
                                radius={[2, 2, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Потеки по часам */}
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-white">Потеки по часам</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="hour" stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} 
                                labelStyle={{ color: '#fff' }}
                            />
                            <Bar 
                                dataKey="runs" 
                                fill="#10b981" 
                                name="Потеки"
                                radius={[2, 2, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Пузыри по часам */}
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-white">Пузыри по часам</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="hour" stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} 
                                labelStyle={{ color: '#fff' }}
                            />
                            <Bar 
                                dataKey="bubbling" 
                                fill="#8b5cf6" 
                                name="Пузыри"
                                radius={[2, 2, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Сводная статистика */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg text-center">
                    <div className="text-3xl font-bold text-red-500 mb-2">
                        {dailyData.reduce((sum, day) => sum + day.defects, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Дефектов за 30 дней</div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-2">
                        {Math.round(dailyData.reduce((sum, day) => sum + day.defects, 0) / 30)}
                    </div>
                    <div className="text-sm text-gray-400">Среднее в день</div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg text-center">
                    <div className="text-3xl font-bold text-green-500 mb-2">
                        {Math.max(...dailyData.map(day => day.defects))}
                    </div>
                    <div className="text-sm text-gray-400">Максимум за день</div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg text-center">
                    <div className="text-3xl font-bold text-purple-500 mb-2">
                        {dailyData.reduce((sum, day) => sum + day.scratch, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Царапин за месяц</div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;