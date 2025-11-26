// nisudev/new-task-manager/NisuDev-new-task-manager-f42f974d5d4e7f0771d714b82ec564ca21eef983/src/app/components/TaskCard.tsx
// src/components/TaskCard.tsx
import React, { useState } from 'react';
import { Task, Interval } from '@/types';
import { Parse, ParseTask, ParseInterval, getUserId } from '@/lib/back4app'; // CAMBIO: Importar utilidades de Parse

interface TaskCardProps {
    task: Task;
    onUpdate: (date: string) => void;
    currentDate: string;
}

// SVG Icons for clean design (replacing emojis)
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4v4m0 0l-1-1m1 1l1-1m-1 1l-1 1m1-1l1 1m-1 1v-4m0 0l-1-1m1 1l1-1m-1 1l-1 1m1-1l1 1m-1 1v-4m0 0l-1-1m1 1l1-1m-1 1l-1 1m1-1l1 1m-1 1v-4m0 0l-1-1m1 1l1-1m-1 1l-1 1m1-1l1 1" /></svg>;
const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const XIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const actionButtonStyle = "p-2 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50";


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
    const userId = getUserId(); 

    // Estados para el nuevo intervalo
    const [hStart, setHStart] = useState('00');
    const [mStart, setMStart] = useState('00');
    const [hEnd, setHEnd] = useState('00');
    const [mEnd, setMEnd] = useState('00');

    // --- Lógica de Validación y CRUD ---

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

    // CAMBIO: Update task status en Parse
    const handleJoinedToggle = async () => {
        try {
            if (userId !== task.USER_ID) { throw new Error("Permiso denegado."); }
            
            // 1. Crear referencia al objeto Task
            const parseTask = new ParseTask();
            parseTask.set('objectId', task.ID); // Asignar el ID de Parse
            
            // 2. Establecer el nuevo valor
            parseTask.set('JOINED', !task.JOINED); 
            
            await parseTask.save();
            
            onUpdate(currentDate); 
        } catch (error: any) {
            console.error("Error al cambiar estado:", error);
            alert('Error al cambiar estado: ' + error.message);
        }
    };
    
    // CAMBIO: Save/Modify task en Parse
    const handleSaveModify = async () => {
        try {
            if (userId !== task.USER_ID) { throw new Error("Permiso denegado."); }

            const parseTask = new ParseTask();
            parseTask.set('objectId', task.ID);
            
            parseTask.set('TITLE', title);
            parseTask.set('DESCRIPTION', description);
            
            await parseTask.save();
            
            setIsEditing(false);
            onUpdate(currentDate); 
        } catch (error: any) {
            console.error("Error al guardar:", error);
            alert('Error al guardar: ' + error.message);
        }
    };

    // CAMBIO: Delete task y sus intervalos (Parse)
    const handleDeleteTask = async (taskId: string) => {
        if (!window.confirm('¿Está seguro de eliminar esta tarea y todos sus intervalos? (Esta acción no se puede deshacer)')) {
            return;
        }

        try {
            if (userId !== task.USER_ID) { throw new Error("Permiso denegado."); }

            // 1. Eliminar intervalos asociados (dependientes del Pointer)
            // Esto requiere una query para encontrar y eliminar.
            const intervalsQuery = new Parse.Query(ParseInterval);
            const taskPointer = ParseTask.createWithoutData(taskId); // Crear un puntero
            intervalsQuery.equalTo("taskPointer", taskPointer);
            
            const intervalsToDelete = await intervalsQuery.find();
            
            await Parse.Object.destroyAll(intervalsToDelete);
            console.log(`[DELETE] ${intervalsToDelete.length} intervalos eliminados con éxito.`);

            // 2. Eliminar la tarea principal (Parse Object)
            const parseTask = ParseTask.createWithoutData(taskId);
            await parseTask.destroy(); 
            console.log("[DELETE] Tarea eliminada con éxito.");

            alert('Tarea eliminada con éxito.');
            onUpdate(currentDate); 
            
        } catch (error: any) {
            console.error('[CRITICAL ERROR] Fallo en handleDeleteTask:', error);
            alert('ERROR al eliminar tarea: ' + (error?.message || 'Error desconocido. **VERIFIQUE SUS REGLAS DE SEGURIDAD DE BACK4APP**'));
        }
    };
    
    // CAMBIO: Delete interval (Parse)
    const handleDeleteInterval = async (intervalId: string) => {
        if (!window.confirm('¿Está seguro de eliminar este intervalo?')) {
            return;
        }

        try {
            if (userId !== task.USER_ID) { throw new Error("Permiso denegado."); }
            
            const parseInterval = ParseInterval.createWithoutData(intervalId);
            await parseInterval.destroy(); 
            console.log("[DELETE] Intervalo eliminado con éxito.");

            alert('Intervalo eliminado con éxito.');
            onUpdate(currentDate); 
            
        } catch (error: any) {
            console.error('[CRITICAL ERROR] Fallo en handleDeleteInterval:', error);
            alert('ERROR al eliminar intervalo: ' + (error?.message || 'Error desconocido. **VERIFIQUE SUS REGLAS DE SEGURIDAD DE BACK4APP**'));
        }
    };

    // CAMBIO: Add interval (Parse)
    const handleAddInterval = async () => {
        if (!validateTime(hStart, mStart) || !validateTime(hEnd, mEnd)) return;
        
        const timeStart = `${hStart.padStart(2, '0')}:${mStart.padStart(2, '0')}:00`;
        const timeEnd = `${hEnd.padStart(2, '0')}:${mEnd.padStart(2, '0')}:00`;
        
        if (timeStart >= timeEnd) {
            alert('La hora de inicio debe ser anterior a la hora de término.');
            return;
        }

        try {
            if (userId !== task.USER_ID) { throw new Error("Permiso denegado."); }
            
            // 1. Crear el puntero a la Tarea
            const taskPointer = ParseTask.createWithoutData(task.ID);
            
            // 2. Crear el objeto Interval
            const newInterval = new ParseInterval();
            newInterval.set('taskPointer', taskPointer);
            newInterval.set('TIME_START', timeStart);
            newInterval.set('TIME_END', timeEnd);
            
            await newInterval.save();

            setHStart('00'); setMStart('00'); setHEnd('00'); setMEnd('00');
            onUpdate(currentDate); 
            
        } catch (error: any) {
            console.error("Error al añadir intervalo:", error);
            alert('ERROR al añadir intervalo: ' + error.message);
        }
    };

    // Estilos sobrios
    const inputStyle = "w-full p-2 border bg-gray-50 border-gray-300 rounded-lg text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

    // Estilo de tarjeta: fondo blanco, borde izquierdo para destacar tipo/estado.
    const typeColor = task.TYPE === 'SOPORTE' ? 'pink' : 'green';

    // NEW: Visual feedback for JOINED status (darker background and stronger border)
    const taskStatusStyle = task.JOINED 
        ? `bg-${typeColor}-100 border-l-4 border-${typeColor}-600 shadow-md` // Highlighted when JOINED
        : `bg-gray-50 border-l-4 border-${typeColor}-300`; // Subtle when not JOINED


    return (
        <div className="flex flex-row gap-4 p-4 border border-gray-200 rounded-xl bg-white text-slate-900 shadow-md">
            
            {/* 1. Tarjeta Principal (TASK) */}
            <div className={`flex-shrink-0 w-1/2 p-4 rounded-lg ${taskStatusStyle} transition-all duration-300`}>
                
                <div className="flex justify-between items-start mb-4">
                    
                    {/* Control Buttons (Replaced Emojis with Icons & Buttons) */}
                    <div className="flex space-x-3 text-lg">
                        <button 
                            onClick={() => setIsEditing(!isEditing)} 
                            className={`${actionButtonStyle} ${isEditing ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`} 
                            title={isEditing ? 'Cancelar edición' : 'Editar tarea'}
                        >
                            {isEditing ? <XIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
                        </button>

                        {isEditing && (
                            <>
                                <button 
                                    onClick={handleSaveModify} 
                                    className={`${actionButtonStyle} bg-green-50 text-green-600 hover:bg-green-100`} 
                                    title='Guardar cambios'
                                >
                                    <SaveIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteTask(task.ID as string)} 
                                    className={`${actionButtonStyle} bg-red-50 text-red-600 hover:bg-red-100`} 
                                    title='Eliminar tarea'
                                >
                                    <DeleteIcon className="w-5 h-5" />
                                </button>
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
                    <input 
                        type="checkbox" 
                        checked={task.JOINED} 
                        onChange={handleJoinedToggle} 
                        // Note: Tailwind requires full class strings to be present, using the defined colors
                        className={`w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 cursor-pointer checked:bg-${typeColor}-500 checked:border-transparent`} 
                        id={`joined-${task.ID}`}
                    />
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
                        .sort((a, b) => (a.ID as string).localeCompare(b.ID as string)) 
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
                                        onClick={() => handleDeleteInterval(interval.ID as string)} 
                                        className="text-red-600 hover:text-red-500 transition-colors"
                                        title="Eliminar Intervalo"
                                    >
                                        <DeleteIcon className="h-4 w-4" />
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