// nisudev/new-task-manager/NisuDev-new-task-manager-3225873f3c07d5794b38fee3028b29fb4d12e05f/src/app/components/TaskCard.tsx
// src/components/TaskCard.tsx
import React, { useState } from 'react';
import { Task, Interval } from '@/types';
import { supabase } from '@/lib/supabase';

interface TaskCardProps {
    task: Task;
    onUpdate: (date: string) => void;
    currentDate: string;
}

// Sub-component for clean time input rendering
interface TimeInputProps {
    label: string;
    hValue: string;
    mValue: string;
    onHChange: (value: string) => void;
    onMChange: (value: string) => void;
}

const TimeInput: React.FC<TimeInputProps> = ({ label, hValue, mValue, onHChange, onMChange }) => {
    // Inputs claros y limpios
    const timeInputStyle = "w-14 p-2 text-center border bg-gray-50 border-gray-300 rounded-lg text-slate-900 font-mono text-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors";
    
    return (
        <div>
            <h5 className="text-center text-sm mb-2 text-gray-600">{label}</h5>
            <div className="flex justify-center space-x-2">
                <input 
                    type="text" 
                    maxLength={2} 
                    value={hValue} 
                    onChange={(e) => onHChange(e.target.value.replace(/[^0-9]/g, ''))} 
                    className={timeInputStyle} 
                />
                <span className="font-bold text-xl text-gray-500">:</span>
                <input 
                    type="text" 
                    maxLength={2} 
                    value={mValue} 
                    onChange={(e) => onMChange(e.target.value.replace(/[^0-9]/g, ''))} 
                    className={timeInputStyle} 
                />
            </div>
        </div>
    );
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

    // Estilos sobrios
    const inputStyle = "w-full p-2 border bg-gray-50 border-gray-300 rounded-lg text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";
    const iconStyle = "w-5 h-5 text-gray-500 hover:text-indigo-600 transition-colors";


    // Estilo de tarjeta simple, fondo blanco, borde izquierdo para destacar tipo/estado.
    const taskColor = task.TYPE === 'SOPORTE' 
        ? (task.JOINED 
            ? 'border-l-4 border-pink-500' 
            : 'border-l-4 border-pink-300'
        )
        : (task.JOINED 
            ? 'border-l-4 border-green-500' 
            : 'border-l-4 border-green-300'
        );


    return (
        <div className="flex flex-row gap-4 p-4 border border-gray-200 rounded-xl bg-white text-slate-900 shadow-md">
            
            {/* 1. Tarjeta Principal (TASK) */}
            <div className={`flex-shrink-0 w-1/2 p-4 rounded-lg bg-gray-50 ${taskColor}`}>
                
                <div className="flex justify-between items-start mb-4">
                    
                    {/* Control Icons */}
                    <div className="flex space-x-3 text-lg">
                        <i onClick={() => setIsEditing(!isEditing)} className={`cursor-pointer ${iconStyle} ${isEditing ? 'text-red-600' : ''}`} title={isEditing ? 'Cancelar edición' : 'Editar tarea'}>
                            {isEditing ? '✖️' : '✏️'}
                        </i>
                        {isEditing && (
                            <>
                                <i onClick={handleSaveModify} className={`cursor-pointer text-green-600 hover:text-green-500 transition-colors`} title='Guardar cambios'>💾</i>
                                <i onClick={() => handleDeleteTask(task.ID)} className={`cursor-pointer text-red-600 hover:text-red-500 transition-colors`} title='Eliminar tarea'>🗑️</i>
                            </>
                        )}
                    </div>
                    
                    {/* Total Minutes Display (Chip discreto) */}
                    <p className="text-lg font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                        {task.totalMinutes} Min
                    </p>
                </div>

                <div className='pb-4 space-y-2'>
                    
                    {!isEditing && (
                        <div>
                            <h3 className="text-xl font-bold mb-1">{task.TITLE}</h3>
                            <p className="text-gray-600 text-sm">{task.DESCRIPTION}</p>
                            <p className="text-xs font-mono mt-1 text-gray-500">APLICANTE: {task.APPLICANT}</p>
                        </div>
                    )}
                    
                    {isEditing && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium mb-1 text-gray-600">Título</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputStyle}/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-gray-600">Descripción</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputStyle}/>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* JOINED Toggle */}
                <div className="flex items-center pt-3 border-t border-gray-200">
                    <input type="checkbox" checked={task.JOINED} onChange={handleJoinedToggle} className="w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 cursor-pointer" id={`joined-${task.ID}`}/>
                    <label htmlFor={`joined-${task.ID}`} className="ml-2 text-sm font-medium text-slate-800">
                        Ingresado
                    </label>
                </div>
            </div>

            {/* 2. Lista de Intervalos */}
            <div className="w-1/4 space-y-2 max-h-72 overflow-y-auto pr-2">
                <h5 className="font-semibold text-gray-700 border-b border-gray-200 pb-1 sticky top-0 bg-white z-10 text-sm">Intervalos ({task.intervals.length})</h5>
                {task.intervals.length > 0 ? (
                    task.intervals
                        .sort((a, b) => a.ID - b.ID)
                        .map(interval => (
                            <div key={interval.ID} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs transition-colors hover:border-indigo-500">
                                <span className="text-indigo-600 font-mono">
                                    {interval.TIME_START.substring(0, 5)} - {interval.TIME_END.substring(0, 5)}
                                </span>
                                <div className='flex items-center space-x-2'>
                                    <span className="font-semibold text-slate-900 bg-gray-200 px-1 py-0.5 rounded-sm">
                                        {interval.DIFF} Min
                                    </span>
                                    <button 
                                        onClick={() => handleDeleteInterval(interval.ID)} 
                                        className="text-red-600 hover:text-red-500 transition-colors"
                                        title="Eliminar Intervalo"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                ) : (<p className="text-xs text-gray-500 p-2">Sin intervalos.</p>)}
            </div>

            {/* 3. Panel de Agregar Intervalo */}
            <div className="flex-shrink-0 w-1/4 p-4 border-2 border-dashed border-gray-300 rounded-xl bg-white space-y-4 shadow-inner">
                <h5 className="text-center font-bold text-base text-indigo-600 border-b border-gray-200 pb-2">Añadir Intervalo</h5>
                
                {/* Inputs de Hora Inicio */}
                <TimeInput label="Inicio (HH:MM)" hValue={hStart} mValue={mStart} onHChange={setHStart} onMChange={setMStart} />

                {/* Inputs de Hora Término */}
                <TimeInput label="Término (HH:MM)" hValue={hEnd} mValue={mEnd} onHChange={setHEnd} onMChange={setMEnd} />
                
                {/* Botón Agregar */}
                <div className="text-center pt-2">
                    <button onClick={handleAddInterval} className="w-10 h-10 bg-indigo-600 text-white rounded-full text-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TaskCard;