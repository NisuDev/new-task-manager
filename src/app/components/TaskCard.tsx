// src/components/TaskCard.tsx
import React, { useState } from 'react';
import { Task, Interval } from '@/types';
import { supabase } from '@/lib/supabase';

interface TaskCardProps {
    task: Task;
    onUpdate: (date: string) => void;
    currentDate: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, currentDate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.TITLE);
    const [description, setDescription] = useState(task.DESCRIPTION);

    // Estados para el nuevo intervalo
    const [hStart, setHStart] = useState('00');
    const [mStart, setMStart] = useState('00');
    const [hEnd, setHEnd] = useState('00');
    const [mEnd, setMEnd] = useState('00');

    // --- Lógica de Validación y CRUD (Eliminación, Guardar, Intervalos) ---

    const validateTime = (h: string, m: string): boolean => {
        const hour = parseInt(h);
        const minute = parseInt(m);
        
        if (isNaN(hour) || isNaN(minute) || h.length > 2 || m.length > 2) {
             alert('Debe ingresar horas/minutos válidos de hasta dos dígitos.');
             return false;
        }

        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) { 
            alert('Debe ingresar una hora válida (00-23) y minutos válidos (00-59).');
            return false;
        }
        
        return true;
    }

    // Reemplaza joinedTask()
    const handleJoinedToggle = async () => {
        const { error } = await supabase
            .from('task')
            .update({ JOINED: !task.JOINED })
            .eq('ID', task.ID);
            
        if (error) {
            alert('Error al cambiar estado: ' + error.message);
        } else {
            onUpdate(currentDate); 
        }
    };
    
    // Reemplaza saveModifyCard() (y src/saveModifyTask.php)
    const handleSaveModify = async () => {
        const { error } = await supabase
            .from('task')
            .update({ TITLE: title, DESCRIPTION: description })
            .eq('ID', task.ID);
            
        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            setIsEditing(false);
            onUpdate(currentDate); 
        }
    };

    // Reemplaza deleteTask() (y src/deleteTask.php)
    const handleDeleteTask = async (taskId: number) => {
        if (!window.confirm('¿Está seguro de eliminar esta tarea y todos sus intervalos?')) {
            return;
        }

        try {
            // Nota: Se requiere ON DELETE CASCADE en la tabla 'intervals' o eliminar intervalos primero.
            const { error } = await supabase
                .from('task')
                .delete()
                .eq('ID', taskId); 
                
            if (error) throw error;
            onUpdate(currentDate); 
            
        } catch (error: any) {
            alert('ERROR al eliminar tarea: ' + error.message);
        }
    };
    
    // Reemplaza deleteInterval() (y src/deleteInterval.php)
    const handleDeleteInterval = async (intervalId: number) => {
        if (!window.confirm('¿Está seguro de eliminar este intervalo?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('intervals')
                .delete()
                .eq('ID', intervalId); 
                
            if (error) throw error;
            onUpdate(currentDate); 
            
        } catch (error: any) {
            alert('ERROR al eliminar intervalo: ' + error.message);
        }
    };

    // Reemplaza addInterval() (y src/newInterval.php)
    const handleAddInterval = async () => {
        if (!validateTime(hStart, mStart) || !validateTime(hEnd, mEnd)) return;
        
        const timeStart = `${hStart.padStart(2, '0')}:${mStart.padStart(2, '0')}:00`;
        const timeEnd = `${hEnd.padStart(2, '0')}:${mEnd.padStart(2, '0')}:00`;
        
        if (timeStart >= timeEnd) {
            alert('La hora de inicio debe ser anterior a la hora de término.');
            return;
        }

        try {
            const { error } = await supabase
                .from('intervals')
                .insert({
                    TASK_ID: task.ID,
                    TIME_START: timeStart,
                    TIME_END: timeEnd
                });

            if (error) throw error;

            setHStart('00'); setMStart('00'); setHEnd('00'); setMEnd('00');
            onUpdate(currentDate); 
            
        } catch (error: any) {
            alert('ERROR al añadir intervalo: ' + error.message);
        }
    };

    const taskColor = task.TYPE === 'SOPORTE' 
        ? (task.JOINED ? 'bg-pink-200 border-l-8 border-pink-500' : 'bg-pink-100')
        : (task.JOINED ? 'bg-green-200 border-l-8 border-green-500' : 'bg-green-100');

    return (
        <div className="flex flex-row gap-4 p-4 border rounded-xl shadow-lg bg-white">
            
            {/* 1. Tarjeta Principal (TASK) */}
            <div className={`flex-shrink-0 w-1/2 p-4 rounded-lg shadow-md ${taskColor}`}>
                
                <div className="flex justify-between mb-2 text-xl">
                    <i onClick={() => setIsEditing(!isEditing)} className="cursor-pointer">
                        {isEditing ? '❌' : '✏️'}
                    </i>
                    {isEditing && (
                        <div className='flex space-x-3'>
                            <i onClick={handleSaveModify} className="cursor-pointer">💾</i>
                            <i onClick={() => handleDeleteTask(task.ID)} className="cursor-pointer">🗑️</i>
                        </div>
                    )}
                </div>

                <div className='pb-4'>
                    <p className="text-lg font-semibold text-gray-700">{task.totalMinutes} Minutos</p> 
                    
                    {!isEditing && (
                        <div>
                            <h3 className="text-2xl font-bold">{task.TITLE}</h3>
                            <p className="text-gray-600">{task.DESCRIPTION}</p>
                        </div>
                    )}
                    
                    {isEditing && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium">Titulo</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded"/>
                            <label className="block text-sm font-medium">Descripción</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full p-2 border rounded"/>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center mt-3">
                    <input type="checkbox" checked={task.JOINED} onChange={handleJoinedToggle} className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" id={`joined-${task.ID}`}/>
                    <label htmlFor={`joined-${task.ID}`} className="ml-2 text-gray-900">
                        Ingresado
                    </label>
                </div>
            </div>

            {/* 2. Lista de Intervalos */}
            <div className="flex flex-wrap gap-3 w-1/4 max-h-96 overflow-y-auto">
                {task.intervals.length > 0 ? (
                    task.intervals.map(interval => (
                        <div key={interval.ID} className="w-full p-3 text-center bg-gray-50 rounded-lg shadow-inner">
                            <p className="text-xs text-gray-500">INICIO</p>
                            <h5 className="font-semibold">{interval.TIME_START.substring(0, 5)}</h5>
                            <p className="text-xs text-gray-500">TÉRMINO</p>
                            <h5 className="font-semibold">{interval.TIME_END.substring(0, 5)}</h5>
                            <div className="my-2 p-1 bg-white rounded">
                                <h4 className="font-bold">{interval.DIFF} Min</h4>
                            </div>
                            <button onClick={() => handleDeleteInterval(interval.ID)} className="text-red-500 hover:text-red-700 text-2xl">
                                 - 
                            </button>
                        </div>
                    ))
                ) : (<p className="text-sm text-gray-400">Sin intervalos.</p>)}
            </div>

            {/* 3. Panel de Agregar Intervalo */}
            <div className="flex-shrink-0 w-1/4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white space-y-4">
                <h5 className="text-center font-bold">Agregar Intervalo</h5>
                
                {/* Inputs de Hora Inicio */}
                <div>
                    <h5 className="text-center text-sm mb-1">Hora Inicio</h5>
                    <div className="flex justify-center space-x-1">
                        <input type="text" maxLength={2} value={hStart} onChange={(e) => setHStart(e.target.value)} className="w-12 p-1 text-center border rounded" />
                        <span className="font-bold">:</span>
                        <input type="text" maxLength={2} value={mStart} onChange={(e) => setMStart(e.target.value)} className="w-12 p-1 text-center border rounded" />
                    </div>
                </div>

                {/* Inputs de Hora Término */}
                <div>
                    <h5 className="text-center text-sm mb-1">Hora Termino</h5>
                    <div className="flex justify-center space-x-1">
                        <input type="text" maxLength={2} value={hEnd} onChange={(e) => setHEnd(e.target.value)} className="w-12 p-1 text-center border rounded" />
                        <span className="font-bold">:</span>
                        <input type="text" maxLength={2} value={mEnd} onChange={(e) => setMEnd(e.target.value)} className="w-12 p-1 text-center border rounded" />
                    </div>
                </div>
                
                {/* Botón Agregar */}
                <div className="text-center pt-2">
                    <button onClick={handleAddInterval} className="w-10 h-10 bg-green-500 text-white rounded-full text-2xl font-bold hover:bg-green-600">
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TaskCard;