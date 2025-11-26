// src/app/components/TaskCard.tsx
import React, { useState } from 'react';
import { Task, Interval } from '@/types';
import { Parse, ParseTask, ParseInterval, getUserId } from '@/lib/back4app'; // Importar utilidades de Parse
import DeleteConfirmationModal from './DeleteConfirmationModal'; // Importar el modal

interface TaskCardProps {
    task: Task;
    onUpdate: (date: string) => void;
    currentDate: string;
}

// SVG Icons for clean design
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4v4m0 0l-1-1m1 1l1-1m-1 1l-1 1m1-1l1 1m-1 1v-4m0 0l-1-1m1 1l1-1m-1 1l-1 1m1-1l1 1m-1 1v-4m0 0l-1-1m1 1l1-1m-1 1l-1 1m1-1l1 1" /></svg>;
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

const TaskCard = ({ task, onUpdate, currentDate }: TaskCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.TITLE);
    const [description, setDescription] = useState(task.DESCRIPTION);
    const userId = getUserId(); 

    // Estados para el nuevo intervalo
    const [hStart, setHStart] = useState('00');
    const [mStart, setMStart] = useState('00');
    const [hEnd, setHEnd] = useState('00');
    const [mEnd, setMEnd] = useState('00');

    // Estados para control del modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'task' | 'interval'; id: string; } | null>(null);
    const [deleteMessage, setDeleteMessage] = useState('');

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

    const handleJoinedToggle = async () => {
        try {
            if (userId !== task.USER_ID) { throw new Error("Permiso denegado."); }
            
            const parseTask = new ParseTask();
            parseTask.set('objectId', task.ID);
            parseTask.set('JOINED', !task.JOINED); 
            
            await parseTask.save();
            onUpdate(currentDate); 
        } catch (error: any) {
            console.error("Error al cambiar estado:", error);
            alert('Error al cambiar estado: ' + error.message);
        }
    };
    
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

    const executeDeleteTask = async (taskId: string) => {
        try {
            if (userId !== task.USER_ID) { throw new Error("Permiso denegado."); }

            const intervalsQuery = new Parse.Query(ParseInterval);
            const taskPointer = ParseTask.createWithoutData(taskId);
            intervalsQuery.equalTo("taskPointer", taskPointer);
            
            const intervalsToDelete = await intervalsQuery.find();
            await Parse.Object.destroyAll(intervalsToDelete);

            const taskQuery = new Parse.Query(ParseTask);
            const taskToDelete = await taskQuery.get(taskId);
            await taskToDelete.destroy();

            onUpdate(currentDate); 
            
        } catch (error: any) {
            console.error('[CRITICAL ERROR] Fallo en executeDeleteTask:', error);
            alert('ERROR al eliminar tarea: ' + (error?.message || 'Error desconocido.') + '. Revise sus ACLs en Back4App.');
        }
    };
    
    const executeDeleteInterval = async (intervalId: string) => {
        try {
            if (userId !== task.USER_ID) { throw new Error("Permiso denegado."); }
            
            const intervalQuery = new Parse.Query(ParseInterval);
            const intervalToDelete = await intervalQuery.get(intervalId);
            await intervalToDelete.destroy();

            onUpdate(currentDate); 
            
        } catch (error: any) {
            console.error('[CRITICAL ERROR] Fallo en executeDeleteInterval:', error);
            alert('ERROR al eliminar intervalo: ' + (error?.message || 'Error desconocido.') + '. Revise sus ACLs en Back4App.');
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        setIsModalOpen(false);
        
        if (deleteTarget.type === 'task') {
            await executeDeleteTask(deleteTarget.id);
        } else if (deleteTarget.type === 'interval') {
            await executeDeleteInterval(deleteTarget.id);
        }
        
        setDeleteTarget(null);
        setDeleteMessage('');
    };

    const handleDeleteTaskClick = (taskId: string) => {
        setDeleteTarget({ type: 'task', id: taskId });
        setDeleteMessage('¿Está seguro de eliminar esta tarea y todos sus intervalos? (Esta acción no se puede deshacer)');
        setIsModalOpen(true);
    };

    const handleDeleteIntervalClick = (intervalId: string) => {
        setDeleteTarget({ type: 'interval', id: intervalId });
        setDeleteMessage('¿Está seguro de eliminar este intervalo?');
        setIsModalOpen(true);
    };

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
            
            const currentUser = Parse.User.current(); 
            if (!currentUser) { 
                alert('Error de autenticación. Por favor, vuelva a iniciar sesión.');
                return;
            }

            const taskPointer = ParseTask.createWithoutData(task.ID);
            const newInterval = new ParseInterval();
            
            const acl = new Parse.ACL(currentUser);
            newInterval.setACL(acl);
            newInterval.set('owner', currentUser); 

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
    const isSoporte = task.TYPE === 'SOPORTE';

    const taskStatusStyle = task.JOINED
        ? isSoporte
            ? 'bg-pink-100 border-l-4 border-pink-600 shadow-md' 
            : 'bg-green-100 border-l-4 border-green-600 shadow-md' 
        : isSoporte
            ? 'bg-gray-50 border-l-4 border-pink-300' 
            : 'bg-gray-50 border-l-4 border-green-300'; 

    // LÓGICA NUEVA: Encontrar la hora de término más alta entre los intervalos
    const latestEndTime = task.intervals.reduce((max, interval) => {
        return interval.TIME_END > max ? interval.TIME_END : max;
    }, '');

    return (
        <div className="flex flex-row gap-4 p-4 border border-gray-200 rounded-xl bg-white text-slate-900 shadow-md">
            
            {/* 1. Tarjeta Principal (TASK) */}
            <div className={`flex-shrink-0 w-1/2 p-4 rounded-lg ${taskStatusStyle} transition-all duration-300`}>
                
                <div className="flex justify-between items-start mb-4">
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
                                    onClick={() => handleDeleteTaskClick(task.ID as string)} 
                                    className={`${actionButtonStyle} bg-red-50 text-red-600 hover:bg-red-100`} 
                                    title='Eliminar tarea'
                                >
                                    <DeleteIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                    
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
                
                <div className="flex items-center pt-3 border-t border-gray-200">
                    <input 
                        type="checkbox" 
                        checked={task.JOINED} 
                        onChange={handleJoinedToggle} 
                        className={`w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 cursor-pointer ${isSoporte ? 'checked:bg-pink-500' : 'checked:bg-green-500'} checked:border-transparent`} 
                        id={`joined-${task.ID}`}
                    />
                    <label htmlFor={`joined-${task.ID}`} className="ml-2 text-sm font-medium text-slate-800">
                        Ingresado
                    </label>
                </div>
            </div>

            {/* 2. Lista de Intervalos (Modificado para resaltar el último) */}
            <div className="w-1/4 space-y-2 max-h-72 overflow-y-auto pr-2">
                <h5 className="font-semibold text-gray-700 border-b border-gray-200 pb-1 sticky top-0 bg-white z-10 text-sm">Intervalos ({task.intervals.length})</h5>
                {task.intervals.length > 0 ? (
                    task.intervals
                        .sort((a, b) => (a.ID as string).localeCompare(b.ID as string)) 
                        .map(interval => {
                            // Identificar si es el último
                            const isLatest = interval.TIME_END === latestEndTime;
                            
                            // Estilo Condicional
                            const intervalStyle = isLatest
                                ? "flex justify-between items-center p-2 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-xs shadow-sm"
                                : "flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs transition-colors hover:border-indigo-500";

                            return (
                                <div key={interval.ID} className={intervalStyle}>
                                    <div className="flex flex-col">
                                        <span className={`font-mono ${isLatest ? 'text-amber-700 font-bold' : 'text-indigo-600'}`}>
                                            {interval.TIME_START.substring(0, 5)} - {interval.TIME_END.substring(0, 5)}
                                        </span>
                                        {isLatest && <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">Último</span>}
                                    </div>
                                    
                                    <div className='flex items-center space-x-2'>
                                        <span className={`font-semibold px-1 py-0.5 rounded-sm ${isLatest ? 'text-amber-900 bg-amber-200' : 'text-slate-900 bg-gray-200'}`}>
                                            {interval.DIFF} Min
                                        </span>
                                        <button 
                                            onClick={() => handleDeleteIntervalClick(interval.ID as string)} 
                                            className="text-red-600 hover:text-red-500 transition-colors"
                                            title="Eliminar Intervalo"
                                        >
                                            <DeleteIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                ) : (<p className="text-xs text-gray-500 p-2">Sin intervalos.</p>)}
            </div>

            {/* 3. Panel de Agregar Intervalo */}
            <div className="flex-shrink-0 w-1/4 p-4 border-2 border-dashed border-gray-300 rounded-xl bg-white space-y-4 shadow-inner">
                <h5 className="text-center font-bold text-base text-indigo-600 border-b border-gray-200 pb-2">Añadir Intervalo</h5>
                
                <TimeInput label="Inicio (HH:MM)" hValue={hStart} mValue={mStart} onHChange={setHStart} onMChange={setMStart} />
                <TimeInput label="Término (HH:MM)" hValue={hEnd} mValue={mEnd} onHChange={setHEnd} onMChange={setMEnd} />
                
                <div className="text-center pt-2">
                    <button onClick={handleAddInterval} className="w-10 h-10 bg-indigo-600 text-white rounded-full text-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">
                        +
                    </button>
                </div>
            </div>
            
            <DeleteConfirmationModal
                isOpen={isModalOpen}
                message={deleteMessage}
                onConfirm={handleConfirmDelete}
                onClose={() => {
                    setIsModalOpen(false);
                    setDeleteTarget(null);
                    setDeleteMessage('');
                }}
            />
        </div>
    );
}

export default TaskCard;