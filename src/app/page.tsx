// nisudev/new-task-manager/NisuDev-new-task-manager-3225873f3c07d5794b38fee3028b29fb4d12e05f/src/app/page.tsx
// src/app/page.tsx
'use client' 

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Asegúrate de que la ruta a supabase sea correcta
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState(''); // Supabase usa email para signIn
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Reemplaza la función login() de index.php
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Detiene la recarga de la página
        
        if (!email || !password) {
            alert('Debe ingresar correo y contraseña.');
            return;
        }

        setLoading(true);
        try {
            // Usa signInWithPassword, reemplazando la lógica SQL de src/login.php
            const { error } = await supabase.auth.signInWithPassword({ 
                email: email, 
                password: password 
            });

            if (error) {
                // *** DIAGNÓSTICO MEJORADO ***
                // Muestra el mensaje de error exacto de Supabase.
                // Los errores comunes son: "Email not confirmed" o "Invalid login credentials".
                console.error("Login failed:", error);
                alert(`Error al iniciar sesión: ${error.message}. Verifique su correo y contraseña, o si su cuenta requiere confirmación de email.`);
            } else {
                // Éxito: Reemplaza window.open('TaskManager.php','_self');
                router.push('/tasks'); 
            }
        } catch (e) {
            console.error("Login failed", e);
            alert('Ocurrió un error inesperado al intentar iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };
    
    // Opcional: Redirigir si el usuario ya está autenticado (similar a la sesión en PHP)
    React.useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace('/tasks');
            }
        };
        checkSession();
    }, [router]);


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 text-slate-900">
            <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Task Manager Login</h2>
                
                {/* Contenido envuelto en un FORM para un manejo correcto del submit */}
                <form onSubmit={handleLogin}> 
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Correo Electrónico (Usuario)
                        </label>
                        <input
                            type="email" 
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="text-center">
                        <button
                            type="submit" 
                            className="w-full px-4 py-2 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? 'Cargando...' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center">
                  <button onClick={() => router.push('/signup')} className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors">
                      ¿No tienes cuenta? Regístrate aquí.
                  </button>
              </div>
               
            </div>
        </div>
    );
}