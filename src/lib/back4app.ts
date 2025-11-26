// src/lib/back4app.ts
import Parse from 'parse'; // CAMBIO: Importar directamente 'parse' para usar los tipos instalados

// Inicialización de Back4App (Parse SDK)
const appId = process.env.NEXT_PUBLIC_BACK4APP_APP_ID;
const jsKey = process.env.NEXT_PUBLIC_BACK4APP_JS_KEY;

if (!appId || !jsKey) {
  throw new Error('Faltan las variables de entorno de Back4App.');
}

Parse.initialize(appId, jsKey);
Parse.serverURL = 'https://parseapi.back4app.com/'; // URL estándar de Back4App

export { Parse };

// Exportar clases de Parse como tipos de objetos para facilitar el uso
export const ParseTask = Parse.Object.extend("Task");
export const ParseInterval = Parse.Object.extend("Interval");

// Función helper para obtener el ID del usuario
export const getUserId = () => Parse.User.current()?.id || null;