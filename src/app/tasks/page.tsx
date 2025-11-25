// nisudev/new-task-manager/NisuDev-new-task-manager-3225873f3c07d5794b38fee3028b29fb4d12e05f/src/app/tasks/page.tsx
'use client' 

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, Interval } from '@/types';
import TaskCard from '../components/TaskCard'; 
import { useRouter } from 'next/navigation'; 

const calculateTotalMinutes = (intervals: Interval[]): number => {
    return intervals.reduce((sum, interval) => {
        if (interval.TIME_START && interval.TIME_END) {
            // Asume que TIME_START y TIME_END están en formato "HH:MM:SS" (como se inserta en TaskCard.tsx)
            const [hStart, mStart] = interval.TIME_START.substring(0, 5).split(':').map(Number);
            const [hEnd, mEnd] = interval.TIME_END.substring(0, 5).split(':').map(Number);
            const totalMinsStart = hStart * 60 + mStart;
            const totalMinsEnd = hEnd * 60 + mEnd;
            const diff = totalMinsEnd - totalMinsStart;
            // Asegura que no se sumen tiempos negativos si la lógica de la DB lo permite
            return sum + (diff > 0 ? diff : 0);
        }
        return sum;
    }, 0);
};

export default function TasksPage() {
    // FIX: Initialize with a server-safe value (current date)
    const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalDayMinutes, setTotalDayMinutes] = useState<number | null>(null); // Nuevo estado
    const router = useRouter();

    useEffect(() => {
        let initialDate = new Date().toISOString().substring(0, 10);

        // Acceder a localStorage solo si estamos en el entorno del navegador
        if (typeof window !== 'undefined') {
            const storedDate = localStorage.getItem('date');
            if (storedDate) {
                initialDate = storedDate;
                setDate(storedDate);
            }
        }

        const checkUserAndFetch = async (currentDate: string) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/'); 
            } else {
                fetchTasksAndSummary(currentDate);
            }
        };

        checkUserAndFetch(initialDate);
        
    }, [router]);
    
    // Función central para obtener Tareas y Resumen (Reemplaza getDate() y getTime())
    const fetchTasksAndSummary = async (selectedDate: string) => {
        setLoading(true);
        try {
            // Update localStorage inside fetch, since it's now client-side logic
            if (typeof window !== 'undefined') {
                 localStorage.setItem('date', selectedDate);
            }

            // If the date in state is different, update it (only needed if triggered externally, e.g. from the date picker)
            if (date !== selectedDate) {
                setDate(selectedDate);
            }
            
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
                const intervals: Interval[] = (task.intervals as any[]).map(int => ({ 
                    ...int, 
                    TASK_ID: task.ID, 
                    DIFF: calculateTotalMinutes([int as Interval]), // Recalcula la diferencia para un solo intervalo
                }));
                
                const totalMinutes = calculateTotalMinutes(intervals);
                totalMinutesForDay += totalMinutes;

                return {
                    ...task,
                    intervals: intervals,
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
        // Clear localStorage only on client
        if (typeof window !== 'undefined') {
            localStorage.removeItem('date');
        }
        router.push('/');
    };
    

    return (
        // Fondo claro
        <div className="min-h-screen bg-gray-50 p-8 text-slate-900">
            <div className="container mx-auto max-w-5xl">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-6 border-b border-gray-200">
                    <h1 className="text-3xl font-extrabold text-slate-900">Task Manager</h1>
                    <button 
                        onClick={handleLogout} 
                        className="px-4 py-2 bg-gray-200 text-slate-800 font-medium rounded-lg hover:bg-gray-300 transition-colors border border-gray-300"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                {/* Date and Action Controls (Cleaned up) */}
                <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4 my-8 p-4 bg-white rounded-xl shadow-md border border-gray-200">
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-slate-900 text-base focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    <button 
                        onClick={() => fetchTasksAndSummary(date)} 
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : 'Ver Tareas'}
                    </button>
                </div>

                {/* Resumen de Tiempo */}
                <TimeSummary totalMinutes={totalDayMinutes} />
                
                {/* Lista de Tareas */}
                <div id="card-display" className="space-y-4">
                    {loading ? (
                        <div className="text-center text-indigo-600 p-8 bg-white rounded-xl shadow-md">Cargando tareas...</div>
                    ) : tasks.length === 0 ? (
                        <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-xl text-center shadow-md">
                            <p className="text-gray-600 mb-5 text-lg">No hay tareas para esta fecha.</p>
                            <div className="flex justify-center space-x-4">
                                <button onClick={() => handleNewTask('TAREA')} className="px-5 py-2 text-white bg-green-600 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md">
                                    + Nueva Tarea
                                </button>
                                <button onClick={() => handleNewTask('SOPORTE')} className="px-5 py-2 text-white bg-pink-600 rounded-lg font-medium hover:bg-pink-700 transition-colors shadow-md">
                                    + Nuevo Soporte
                                </button>
                            </div>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <TaskCard 
                                key={task.ID} 
                                task={task as Task} 
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
// Componente de Resumen de Tiempo (Minimalista Claro)
// ----------------------------------------------------

interface TimeSummaryProps {
    totalMinutes: number | null;
}

const DAILY_TARGET_MINUTES = 570; // 9 horas y media (constante del PHP)

const formatMinutes = (minutes: number): string => {
    const sign = minutes >= 0 ? '' : '';
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    
    const hDisplay = hours > 0 ? `${hours}h ` : '';
    const mDisplay = `${mins}m`;
    
    return `${sign}${hDisplay}${mDisplay}`.trim();
}

const TimeSummary: React.FC<TimeSummaryProps> = ({ totalMinutes }) => {
    if (totalMinutes === null || totalMinutes === 0) return null;
    
    const resta = DAILY_TARGET_MINUTES - totalMinutes;
    
    // Contenedor blanco con borde gris
    const baseStyle = "px-4 py-2 text-center text-lg font-semibold rounded-lg border border-gray-200 bg-white shadow-sm transition-colors";
    
    // Estilos de diferencia: azul para positivo, rojo para negativo
    const diffStyle = resta >= 0 
        ? 'bg-indigo-600 text-white' 
        : 'bg-red-600 text-white';

    return (
        <div className="flex justify-center mb-8">
            <div className="flex space-x-3 items-center text-sm md:text-base">
                
                <div className={`${baseStyle} text-green-700`}>
                    <p className="text-xs font-normal text-gray-500">Trabajado</p>
                    <p className="mt-1">{formatMinutes(totalMinutes)}</p>
                </div>
                
                <span className="text-gray-500">-</span>
                
                <div className={`${baseStyle} text-gray-700`}>
                    <p className="text-xs font-normal text-gray-500">Meta (9.5h)</p>
                    <p className="mt-1">{formatMinutes(DAILY_TARGET_MINUTES)}</p>
                </div>
                
                <span className="text-gray-500">=</span>
                
                <div className={`${baseStyle} ${diffStyle}`}>
                    <p className="text-xs font-normal text-white/80">{resta >= 0 ? 'Falta' : 'Exceso'}</p>
                    <p className="mt-1">{formatMinutes(resta)}</p>
                </div>
            </div>
        </div>
    );
}