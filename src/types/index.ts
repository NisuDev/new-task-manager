// src/types/index.ts

export interface Interval {
  // CAMBIO: ID de Back4App (objectId) es un string. Usamos string | number para compatibilidad.
  ID: string | number;
  // CAMBIO: TASK_ID es el objectId de la tarea padre (string).
  TASK_ID: string | number;
  TIME_START: string; 
  TIME_END: string;   
  DIFF: number; // Diferencia en minutos
}

export interface Task {
  // CAMBIO: ID de Back4App (objectId) es un string.
  ID: string | number;
  // CAMBIO: USER_ID (el objectId del Parse.User) es un string.
  USER_ID: string | number;
  // AÑADIDO: 'DAY' ahora es una propiedad directa de la tarea.
  DAY: string; 
  TITLE: string;
  DESCRIPTION: string;
  APPLICANT: string;
  TYPE: 'SOPORTE' | 'TAREA'; 
  JOINED: boolean; 
  
  intervals: Interval[];
  totalMinutes: number; 
}