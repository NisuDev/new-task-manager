# 🚀 Task Manager App

## 1\. Visión General del Proyecto

**Task Manager App** es una aplicación de gestión de tareas desarrollada con **Next.js** en el App Router, utilizando **Back4App** (basado en Parse Server) como su servicio de Backend as a Service (BaaS).

El objetivo principal de la aplicación es proporcionar a los usuarios una plataforma intuitiva para registrar, gestionar y realizar un seguimiento preciso del tiempo dedicado a sus tareas diarias, incluyendo la diferenciación entre "Tareas" y "Soporte".

## 2\. Características Implementadas

La aplicación ofrece un conjunto de funcionalidades robustas y modernas:

  * **Autenticación Completa:**
      * **Registro (`/signup`):** Creación de nuevos usuarios.
      * **Inicio de Sesión (`/`):** Acceso seguro mediante correo/usuario y contraseña.
      * **Cierre de Sesión:** Manejo de la sesión a través de `Parse.User.logOut()`.
  * **Gestión de Tareas y Tiempo:**
      * **CRUD de Tareas:** Creación de nuevas tareas (tipo 'TAREA' o 'SOPORTE'), edición y eliminación.
      * **Gestión de Intervalos:** Adición y eliminación de segmentos de tiempo específicos (`TIME_START`, `TIME_END`) para cada tarea.
      * **Seguimiento por Día:** Las tareas se filtran y gestionan por fecha (campo `DAY`).
      * **Resumen Diario:** Cálculo y visualización del total de minutos trabajados en el día, comparado con un objetivo de **570 minutos (9.5 horas)**.
  * **Experiencia de Usuario (UX):**
      * **UI Moderna:** Diseño limpio y moderno utilizando **Tailwind CSS**.
      * **Gestión de Scroll:** Se implementa lógica de `useRef` y `useEffect` para guardar y restaurar la posición del scroll después de acciones que recargan la lista de tareas (crear, editar, eliminar).
      * **Modal de Confirmación:** Uso de un modal dedicado (`DeleteConfirmationModal`) para prevenir eliminaciones accidentales de tareas o intervalos.

## 3\. Tecnologías Utilizadas

| Tecnología | Versión | Propósito | Fuente |
| :--- | :--- | :--- | :--- |
| **Next.js** | `16.0.3` | Framework de React para el frontend (App Router) | |
| **Back4App (Parse)** | `4.2.0` | Backend as a Service (BaaS) para persistencia de datos y autenticación | |
| **TypeScript** | `^5` | Lenguaje de desarrollo para tipado estático | |
| **React** | `19.2.0` | Librería UI para construir la interfaz de usuario | |
| **Tailwind CSS** | `^4` | Framework CSS utility-first para estilos rápidos y responsivos | |
| **Geist Fonts** | N/A | Tipografía moderna (`Geist`, `Geist_Mono`) para un diseño profesional | |

## 4\. Arquitectura del Proyecto

El proyecto sigue la estructura del **App Router** de Next.js. Toda la lógica de la aplicación es de lado del cliente (`'use client'`) para gestionar el estado, la autenticación y las interacciones CRUD con Back4App.

### 4.1. Estructura de Rutas

| Ruta | Archivo | Tipo de Componente | Responsabilidad |
| :--- | :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Cliente | Formulario de inicio de sesión. |
| `/signup` | `src/app/signup/page.tsx` | Cliente | Formulario de registro de usuario. |
| `/tasks` | `src/app/tasks/page.tsx` | Cliente | Dashboard principal, carga de tareas/intervalos, resumen diario, controles de fecha. |

### 4.2. Capa de Datos (`src/lib/back4app.ts`)

Este archivo es el núcleo de la conexión con el BaaS, asegurando una inicialización única y centralizada del SDK de Parse.

  * **Inicialización:** Configura `Parse.initialize` y `Parse.serverURL` usando las variables de entorno:
      * `NEXT_PUBLIC_BACK4APP_APP_ID`
      * `NEXT_PUBLIC_BACK4APP_JS_KEY`
  * **Exportaciones de Clases:** Expone las referencias a las clases personalizadas de Parse:
      * `ParseTask = Parse.Object.extend("Task")`
      * `ParseInterval = Parse.Object.extend("Interval")`

## 5\. Modelos de Datos (TypeScript / Back4App)

La aplicación define dos interfaces clave que mapean la estructura de las clases en Back4App:

### 5.1. `Interval` (Clase Parse: `Interval`)

Representa un segmento de tiempo trabajado para una tarea específica.

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID` | `string \| number` | `objectId` de Parse para el intervalo. |
| `TASK_ID` | `string \| number` | `objectId` de la Tarea padre. |
| `TIME_START` | `string` | Hora de inicio del intervalo (ej. "09:00:00"). |
| `TIME_END` | `string` | Hora de fin del intervalo (ej. "10:30:00"). |
| `DIFF` | `number` | Diferencia calculada en minutos. |

**Relación:** Contiene un puntero (`taskPointer`) al objeto `Task` padre.

### 5.2. `Task` (Clase Parse: `Task`)

Representa una tarea diaria principal.

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID` | `string \| number` | `objectId` de Parse para la tarea. |
| `USER_ID` | `string \| number` | `objectId` del `Parse.User` propietario. |
| `DAY` | `string` | Fecha de la tarea (formato YYYY-MM-DD). |
| `TITLE` | `string` | Título de la tarea. |
| `DESCRIPTION` | `string` | Descripción de la tarea. |
| `APPLICANT` | `string` | Solicitante/Cliente de la tarea. |
| `TYPE` | `'SOPORTE' \| 'TAREA'` | Clasificación de la tarea. |
| `JOINED` | `boolean` | Indica si el progreso de la tarea ha sido "ingresado". |
| `intervals` | `Interval[]` | Array de intervalos de tiempo asociados a la tarea (no persistente en Parse, se carga bajo demanda). |
| `totalMinutes` | `number` | Minutos totales calculados para esta tarea. |

**Relación:** Contiene un puntero estándar `owner` al `Parse.User` para la ACL.

## 6\. Configuración e Instalación

### 6.1. Requisitos Previos

  * Node.js (ver `pkgs.nodejs_20` en `.idx/dev.nix`).
  * Credenciales de una aplicación Back4App (App ID y JS Key).

### 6.2. Variables de Entorno

Crear un archivo **`.env.local`** en la raíz del proyecto con las siguientes variables:

```bash
NEXT_PUBLIC_BACK4APP_APP_ID=TU_APP_ID
NEXT_PUBLIC_BACK4APP_JS_KEY=TU_JS_KEY
```

### 6.3. Instalación de Dependencias

El proyecto utiliza `npm` (ver `package.json`).

```bash
npm install
# O si se usa el entorno Nix: npm ci --no-audit --prefer-offline --no-progress --timing
```

### 6.4. Comandos de Ejecución

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:3000`. |
| `npm run build` | Compila la aplicación para producción. |
| `npm run start` | Inicia el servidor Next.js en modo producción. |
| `npm run lint` | Ejecuta ESLint para revisión de código. |

## 7\. Detalles de la Implementación del Código

### 7.1. Flujo de Carga de Tareas (`src/app/tasks/page.tsx`)

La función `fetchTasksAndSummary` gestiona la lógica de la vista principal.

1.  **Consulta de Tareas:** Se realiza una consulta principal a la clase `Task` filtrando por `USER_ID` y `DAY`.
2.  **Consulta de Intervalos:** Por cada `Task` obtenida, se realiza una segunda consulta a la clase `Interval`, utilizando el puntero (`taskPointer`) para asociar el intervalo a su tarea.
3.  **Cálculo:** Se calcula el tiempo total en minutos (`calculateTotalMinutes`) para cada tarea (sumando sus intervalos) y el total para el día completo.
4.  **Optimización UX:** Se utiliza `useRef` (`scrollRef`) para capturar la posición de desplazamiento antes de la recarga de datos, y se restaura después del renderizado para mantener el foco visual.

### 7.2. Lógica de `TaskCard` (`src/app/components/TaskCard.tsx`)

El componente `TaskCard` maneja todas las operaciones CRUD a nivel de ítem:

  * **Edición/Guardado:** Permite modificar el título y la descripción de la tarea y guarda los cambios en la clase `Task` de Parse.
  * **Eliminación de Tarea:**
      * Utiliza una función robusta (`executeDeleteTask`) que primero consulta y elimina todos los objetos `Interval` asociados, y luego elimina la `Task` principal.
      * La eliminación está protegida por el `DeleteConfirmationModal`.
  * **Adición de Intervalo:**
      * Valida el formato y la lógica de inicio/fin de tiempo (`validateTime`).
      * Crea un nuevo objeto `ParseInterval`, establece su puntero a la tarea padre (`taskPointer`) y aplica una **ACL** (Access Control List) basada en el usuario actual para seguridad.

### 7.3. Componente de Resumen de Tiempo (`TimeSummary` en `src/app/tasks/page.tsx`)

Este componente puramente de presentación muestra:

  * Tiempo total trabajado (`totalMinutes`).
  * Meta diaria: **570 minutos (9.5 horas)**.
  * Diferencia (Falta / Exceso) en un formato legible (ej. "Xh Ym"). Los estilos utilizan coloración condicional (índigo para 'Falta' y rojo para 'Exceso').
