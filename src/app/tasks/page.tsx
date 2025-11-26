// src/app/tasks/page.tsx
'use client' 

import React, { useState, useEffect, useRef } from 'react'; 
import { Parse, ParseTask, ParseInterval, getUserId } from '@/lib/back4app';
import { useRouter } from 'next/navigation'; 
import { Task, Interval } from '@/types';
import TaskCard from '@/app/components/TaskCard';

// --- Lógica de cálculo de minutos ---
const calculateTotalMinutes = (intervals: Interval[]): number => {
    return intervals.reduce((sum, interval) => {
        if (interval.TIME_START && interval.TIME_END) {
            const [hStart, mStart] = interval.TIME_START.substring(0, 5).split(':').map(Number);
            const [hEnd, mEnd] = interval.TIME_END.substring(0, 5).split(':').map(Number);
            const totalMinsStart = hStart * 60 + mStart;
            const totalMinsEnd = hEnd * 60 + mEnd;
            const diff = totalMinsEnd - totalMinsStart;
            return sum + (diff > 0 ? diff : 0);
        }
        return sum;
    }, 0);
};

export default function TasksPage() {
    const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalDayMinutes, setTotalDayMinutes] = useState<number | null>(null); 
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); 
    
    // NUEVO ESTADO: Para rastrear el ID del último intervalo creado en todo el día
    const [lastCreatedIntervalId, setLastCreatedIntervalId] = useState<string | null>(null);

    const router = useRouter();
    const scrollRef = useRef(0);

    useEffect(() => {
        let initialDate = new Date().toISOString().substring(0, 10);
        if (typeof window !== 'undefined') {
            const storedDate = localStorage.getItem('date');
            if (storedDate) {
                initialDate = storedDate;
                setDate(storedDate);
            }
        }

        const user = Parse.User.current();
        if (!user) {
            router.replace('/'); 
        } else {
            const userId = user.id;
            setCurrentUserId(userId);
            fetchTasksAndSummary(initialDate, userId);
        }
        
    }, [router]);
    
    useEffect(() => {
        if (tasks.length > 0 && scrollRef.current > 0) {
            window.scrollTo(0, scrollRef.current);
            scrollRef.current = 0; 
        }
    }, [tasks]);

    
    const fetchTasksAndSummary = async (selectedDate: string, userId: string | null = getUserId()) => {
        if (!userId) {
            router.replace('/');
            return;
        }

        if (tasks.length > 0) {
            scrollRef.current = window.scrollY;
        }

        setLoading(true);
        try {
            if (typeof window !== 'undefined') {
                 localStorage.setItem('date', selectedDate);
            }
            if (date !== selectedDate) {
                setDate(selectedDate);
            }
            
            const tasksQuery = new Parse.Query(ParseTask);
            tasksQuery.equalTo("USER_ID", userId);
            tasksQuery.equalTo("DAY", selectedDate);
            tasksQuery.ascending("createdAt"); 
            
            const parseTasks = await tasksQuery.find();
            
            const processedTasks: Task[] = [];
            let totalMinutesForDay = 0;

            // Variables para encontrar el intervalo más reciente globalmente
            let globalMaxCreatedAt = 0;
            let globalLatestId: string | null = null;
            
            for (const parseTask of parseTasks) {
                const taskId = parseTask.id;
                
                const intervalsQuery = new Parse.Query(ParseInterval);
                intervalsQuery.equalTo("taskPointer", parseTask);
                intervalsQuery.ascending("createdAt");

                const parseIntervals = await intervalsQuery.find();
                
                const intervals: Interval[] = parseIntervals.map((parseInterval: typeof ParseInterval) => {
                    // Comprobar fecha de creación para identificar el último global
                    const createdAtTime = parseInterval.createdAt.getTime();
                    if (createdAtTime > globalMaxCreatedAt) {
                        globalMaxCreatedAt = createdAtTime;
                        globalLatestId = parseInterval.id;
                    }

                    const diff = calculateTotalMinutes([{ 
                        TIME_START: parseInterval.get('TIME_START'), 
                        TIME_END: parseInterval.get('TIME_END') 
                    } as Interval]);
                    
                    return {
                        ID: parseInterval.id as any, 
                        TASK_ID: taskId as any,
                        TIME_START: parseInterval.get('TIME_START'), 
                        TIME_END: parseInterval.get('TIME_END'),
                        DIFF: diff,
                    };
                });
                
                const totalMinutes = calculateTotalMinutes(intervals);
                totalMinutesForDay += totalMinutes;

                processedTasks.push({
                    ID: taskId as any,
                    USER_ID: userId as any, 
                    DAY: parseTask.get('DAY'),
                    TITLE: parseTask.get('TITLE'),
                    DESCRIPTION: parseTask.get('DESCRIPTION'),
                    APPLICANT: parseTask.get('APPLICANT'),
                    TYPE: parseTask.get('TYPE'),
                    JOINED: parseTask.get('JOINED'),
                    intervals: intervals,
                    totalMinutes: totalMinutes,
                });
            }

            setTasks(processedTasks);
            setTotalDayMinutes(totalMinutesForDay);
            setLastCreatedIntervalId(globalLatestId); // Guardamos el ID ganador
            
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleNewTask = async (type: 'TAREA' | 'SOPORTE') => {
        if (!date || !currentUserId) { alert('Debe seleccionar una fecha e iniciar sesión.'); return; }

        try {
            scrollRef.current = window.scrollY;

            const newTask = new ParseTask();
            
            newTask.set('USER_ID', currentUserId);
            newTask.set('DAY', date); 
            newTask.set('TITLE', (type === 'TAREA' ? 'NUEVA TAREA' : 'NUEVO SOPORTE'));
            newTask.set('DESCRIPTION', 'Descripción Inicial');
            newTask.set('APPLICANT', 'TEST'); 
            newTask.set('TYPE', type);
            newTask.set('JOINED', false);
            newTask.set('owner', Parse.User.current()); 
            
            const acl = new Parse.ACL(Parse.User.current());
            newTask.setACL(acl);

            await newTask.save();
            
            fetchTasksAndSummary(date, currentUserId); 
            
        } catch (error: any) {
            console.error(error);
            alert('ERROR al crear tarea: ' + error.message);
        }
    };

    const handleLogout = async () => {
        await Parse.User.logOut(); 
        if (typeof window !== 'undefined') {
            localStorage.removeItem('date');
        }
        router.push('/');
    };
    

    return (
        <div className="min-h-screen bg-gray-50 p-8 text-slate-900">
            <div className="container mx-auto max-w-5xl">
                
                <div className="flex justify-between items-center pb-6 border-b border-gray-200">
                    <h1 className="text-3xl font-extrabold text-slate-900">Task Manager</h1>
                    <button 
                        onClick={handleLogout} 
                        className="px-4 py-2 bg-gray-200 text-slate-800 font-medium rounded-lg hover:bg-gray-300 transition-colors border border-gray-300"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4 my-8 p-4 bg-white rounded-xl shadow-md border border-gray-200">
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => fetchTasksAndSummary(e.target.value, currentUserId)} 
                        className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-slate-900 text-base focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    <button 
                        onClick={() => fetchTasksAndSummary(date, currentUserId)} 
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : 'Ver Tareas'}
                    </button>
                </div>

                <TimeSummary totalMinutes={totalDayMinutes} />
                
                <div className="flex justify-center space-x-4 mb-8">
                    <button 
                        onClick={() => handleNewTask('TAREA')} 
                        className="px-5 py-2 text-white bg-green-600 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
                        disabled={loading}
                    >
                        + Nueva Tarea
                    </button>
                    <button 
                        onClick={() => handleNewTask('SOPORTE')} 
                        className="px-5 py-2 text-white bg-pink-600 rounded-lg font-medium hover:bg-pink-700 transition-colors shadow-md disabled:opacity-50"
                        disabled={loading}
                    >
                        + Nuevo Soporte
                    </button>
                </div>

                <div id="card-display" className="space-y-4">
                    {loading ? (
                        <div className="text-center text-indigo-600 p-8 bg-white rounded-xl shadow-md">Cargando tareas...</div>
                    ) : tasks.length === 0 ? (
                        <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-xl text-center shadow-md">
                            <p className="text-gray-600 mb-0 text-lg">No hay tareas para esta fecha.</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <TaskCard 
                                key={task.ID} 
                                task={task as Task} 
                                onUpdate={() => { 
                                    scrollRef.current = window.scrollY;
                                    fetchTasksAndSummary(date, currentUserId); 
                                }} 
                                currentDate={date}
                                latestGlobalIntervalId={lastCreatedIntervalId} // PASAR PROP NUEVA
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------
// Componente de Resumen de Tiempo
// ----------------------------------------------------

interface TimeSummaryProps {
    totalMinutes: number | null;
}

const DAILY_TARGET_MINUTES = 570; 

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
    
    const baseStyle = "px-4 py-2 text-center text-lg font-semibold rounded-lg border border-gray-200 bg-white shadow-sm transition-colors";
    
    const diffStyle = resta >= 0 
        ? 'bg-indigo-600 text-white' 
        : 'bg-red-600 text-white';

    return (
        <div className="flex justify-center mb-8">
            <div className="flex space-x-3 items-center text-sm md:text-base">
                
                <div className={`${baseStyle} text-slate-900`}>
                    <p className="text-xs font-normal text-gray-500">Trabajado</p>
                    <p className="mt-1">{formatMinutes(totalMinutes)}</p>
                </div>
                
                <span className="text-gray-500">-</span>
                
                <div className={`${baseStyle} text-slate-900`}>
                    <p className="text-xs font-normal text-gray-500">Meta (9.5h)</p>
                    <p className="mt-1">{formatMinutes(DAILY_TARGET_MINUTES)}</p>
                </div>
                
                <span className="text-gray-500">=</span>
                
                <div className={`${baseStyle} ${diffStyle}`}>
                    <p className="text-xs font-normal text-black/80">{resta >= 0 ? 'Falta' : 'Exceso'}</p>
                    <p className="mt-1 text-black/80">{formatMinutes(resta)}</p>
                </div>
            </div>
        </div>
    );
}