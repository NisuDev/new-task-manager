// src/types/index.ts

export interface Interval {
    ID: number;
    TASK_ID: number;
    TIME_START: string; 
    TIME_END: string;   
    DIFF: number; // Diferencia en minutos
  }
  
  export interface Task {
    ID: number;
    USER_ID: number;
    DAY_ID: number;
    TITLE: string;
    DESCRIPTION: string;
    APPLICANT: string;
    TYPE: 'SOPORTE' | 'TAREA'; 
    JOINED: boolean; 
    
    intervals: Interval[];
    totalMinutes: number; 
  }
  