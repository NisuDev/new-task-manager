// nisudev/new-task-manager/NisuDev-new-task-manager-f42f974d5d4e7f0771d714b82ec564ca21eef983/src/app/page.tsx
// src/app/page.tsx
'use client' 

import React, { useState } from 'react';
import { Parse } from '@/lib/back4app'; // CAMBIO: Importar Parse
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState(''); // Parse usa email para signIn
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Lógica para iniciar sesión
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Detiene la recarga de la página
        
        if (!email || !password) {
            alert('Debe ingresar correo y contraseña.');
            return;
        }

        setLoading(true);
        try {
            // CAMBIO: Usar Parse.User.logIn(username, password)
            // Parse requiere un 'username', por convención usaremos el email como username.
            const user = await Parse.User.logIn(email, password); 

            if (user) {
                router.push('/tasks'); 
            }
        } catch (e: any) {
            console.error("Login failed:", e);
            alert(`Error al iniciar sesión: ${e.message}. Verifique su correo y contraseña.`);
        } finally {
            setLoading(false);
        }
    };
    
    // Opcional: Redirigir si el usuario ya está autenticado
    React.useEffect(() => {
        // CAMBIO: Usar Parse.User.current() para verificar la sesión
        const user = Parse.User.current();
        if (user) {
            router.replace('/tasks');
        }
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