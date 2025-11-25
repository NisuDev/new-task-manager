// src/app/tasks/page.tsx
'use client' 

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, Interval } from '@/types';
import TaskCard from '../components/TaskCard'; 
import { useRouter } from 'next/navigation'; 

const calculateTotalMinutes = (intervals: Interval[]): number => {
    return intervals.reduce((sum, interval) => {
        if (interval.TIME_START && interval.TIME_END) {
            const [hStart, mStart] = interval.TIME_START.split(':').map(Number);
            const [hEnd, mEnd] = interval.TIME_END.split(':').map(Number);
            const totalMinsStart = hStart * 60 + mStart;
            const totalMinsEnd = hEnd * 60 + mEnd;
            return sum + (totalMinsEnd - totalMinsStart);
        }
        return sum;
    }, 0);
};

export default function TasksPage() {
    const [date, setDate] = useState<string>(localStorage.getItem('date') || new Date().toISOString().substring(0, 10));
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalDayMinutes, setTotalDayMinutes] = useState<number | null>(null); // Nuevo estado
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/'); 
            }
        };
        checkUser();
        if (date) {
            fetchTasksAndSummary(date);
        }
    }, [router]);
    
    // Función central para obtener Tareas y Resumen (Reemplaza getDate() y getTime())
    const fetchTasksAndSummary = async (selectedDate: string) => {
        setLoading(true);
        try {
            localStorage.setItem('date', selectedDate);
            
            // 1. Encontrar el DAY_ID
            let { data: dayData, error: dayError } = await supabase
                .from('day')
                .select('ID')
                .eq('DAY', selectedDate)
                .single();

            if (dayError || !dayData) {
                setTasks([]);
                setTotalDayMinutes(null);
                setLoading(false);
                return; 
            }

            const dayId = dayData.ID;

            // 2. Obtener tareas e intervalos
            const { data: taskData, error: taskError } = await supabase
                .from('task')
                .select(`
                    ID, TITLE, DESCRIPTION, APPLICANT, TYPE, JOINED, 
                    intervals (ID, TIME_START, TIME_END)
                `)
                .eq('DAY_ID', dayId)
                .order('ID', { ascending: true });
                

            if (taskError) throw taskError;
            
            let totalMinutesForDay = 0;

            const processedTasks: Task[] = (taskData as any[]).map(task => {
                const totalMinutes = calculateTotalMinutes(task.intervals as Interval[]);
                totalMinutesForDay += totalMinutes;

                return {
                    ...task,
                    intervals: task.intervals.map((int: any) => ({ ...int, DIFF: calculateTotalMinutes([int]) })),
                    totalMinutes: totalMinutes,
                };
            });

            setTasks(processedTasks);
            setTotalDayMinutes(totalMinutesForDay); // Setea el tiempo total
            
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setLoading(false);
        }
    };
    
    // Función para crear nueva tarea (Ver paso 5.1 para la implementación completa)
    const handleNewTask = async (type: 'TAREA' | 'SOPORTE') => {
        if (!date) { alert('Debe seleccionar una fecha.'); return; }

        try {
            const user = await supabase.auth.getUser();
            const userId = user.data.user?.id;
            if (!userId) throw new Error("Usuario no autenticado.");

            let { data: dayData } = await supabase.from('day').select('ID').eq('DAY', date).single();

            let dayId: number;
            if (!dayData) {
                const { data: newDay, error } = await supabase.from('day').insert({ DAY: date }).select('ID').single();
                if (error) throw error;
                dayId = newDay.ID;
            } else {
                dayId = dayData.ID;
            }
            
            const { error: taskError } = await supabase
                .from('task')
                .insert({
                    USER_ID: userId, // Asumiendo que has ajustado el esquema a UUID
                    DAY_ID: dayId,
                    TITLE: (type === 'TAREA' ? 'NUEVA TAREA' : 'NUEVO SOPORTE'),
                    DESCRIPTION: 'Descripción Inicial',
                    APPLICANT: 'TEST', 
                    TYPE: type,
                });

            if (taskError) throw taskError;
            
            fetchTasksAndSummary(date); 
            
        } catch (error: any) {
            alert('ERROR al crear tarea: ' + error.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('date');
        router.push('/');
    };
    

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="container mx-auto max-w-5xl">
                
                <div className="flex justify-between items-center pb-5">
                    <h1 className="text-3xl font-bold text-gray-800">Task Manager</h1>
                    <button 
                        onClick={handleLogout} 
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600 transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                <div className="flex justify-center space-x-4 mb-8 p-4 bg-white rounded-xl shadow-lg">
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md text-lg"
                    />
                    <button 
                        onClick={() => fetchTasksAndSummary(date)} 
                        className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors"
                    >
                        START
                    </button>
                </div>

                {/* Resumen de Tiempo (Reemplaza getTime.php) */}
                <TimeSummary totalMinutes={totalDayMinutes} />
                
                {/* Lista de Tareas */}
                <div id="card-display" className="space-y-6">
                    {/* ... (Lógica de loading y sin tareas) */}
                    {loading ? (
                        <div className="text-center text-gray-500">Cargando tareas...</div>
                    ) : tasks.length === 0 ? (
                        <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg text-center">
                            <p className="text-gray-600 mb-4">No hay tareas para esta fecha.</p>
                            <div className="flex justify-center space-x-4">
                                <button onClick={() => handleNewTask('TAREA')} className="px-4 py-2 text-white bg-green-500 rounded-full hover:bg-green-600">
                                    + Nueva Tarea
                                </button>
                                <button onClick={() => handleNewTask('SOPORTE')} className="px-4 py-2 text-white bg-pink-500 rounded-full hover:bg-pink-600">
                                    + Nuevo Soporte
                                </button>
                            </div>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <TaskCard 
                                key={task.ID} 
                                task={task} 
                                onUpdate={fetchTasksAndSummary} 
                                currentDate={date}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------
// Componente de Resumen de Tiempo (Nuevo Componente)
// ----------------------------------------------------

interface TimeSummaryProps {
    totalMinutes: number | null;
}

const DAILY_TARGET_MINUTES = 570; // 9 horas y media (constante del PHP)

const TimeSummary: React.FC<TimeSummaryProps> = ({ totalMinutes }) => {
    if (totalMinutes === null || totalMinutes === 0) return null;
    
    const resta = DAILY_TARGET_MINUTES - totalMinutes;
    
    const baseStyle = "card px-2 text-center text-xl font-bold rounded-lg shadow-md";
    
    return (
        <div className="flex justify-center mb-8">
            <div className="flex space-x-4">
                <div className={`${baseStyle} bg-green-200 p-3`}>
                    <p>{totalMinutes}</p>
                </div>
                <div className={`${baseStyle} bg-white p-3`}>
                    <p>-</p>
                </div>
                <div className={`${baseStyle} bg-green-200 p-3`}>
                    <p>{DAILY_TARGET_MINUTES}</p>
                </div>
                <div className={`${baseStyle} bg-white p-3`}>
                    <p>=</p>
                </div>
                <div className={`${baseStyle} ${resta >= 0 ? 'bg-blue-200' : 'bg-red-200'} p-3`}>
                    <p>{resta}</p>
                </div>
            </div>
        </div>
    );
}