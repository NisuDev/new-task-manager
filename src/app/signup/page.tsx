// nisudev/new-task-manager/NisuDev-new-task-manager-f42f974d5d4e7f0771d714b82ec564ca21eef983/src/app/signup/page.tsx
// src/app/signup/page.tsx
'use client' 

import React, { useState } from 'react';
import { Parse } from '@/lib/back4app'; // CAMBIO: Importar Parse
import { useRouter } from 'next/navigation'; 

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async () => {
        if (!email || !password) {
            alert('Debe ingresar correo y contraseña.');
            return;
        }

        setLoading(true);
        try {
            // 1. CAMBIO: Inicializar un nuevo usuario de Parse
            const user = new Parse.User();
            
            // Parse requiere 'username' y 'email'. Usamos el email para ambos.
            user.set('username', email); 
            user.set('email', email);
            user.set('password', password); 
            
            // Guardamos el usuario en Back4App
            await user.signUp();

            // 2. Manejar la redirección
            alert('¡Registro exitoso! Redirigiendo a tareas...');
            router.push('/tasks'); 
            
        } catch (e: any) {
            console.error("Signup failed", e);
            alert('Error al registrarse: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 text-slate-900">
            <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Registro de Nuevo Usuario</h2>
                
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Correo Electrónico
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 transition-colors"
                        disabled={loading}
                    />
                </div>
                
                <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña (mínimo 6 caracteres)
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 transition-colors"
                        disabled={loading}
                    />
                </div>
                
                <div className="text-center">
                    <button
                        onClick={handleSignup}
                        className="w-full px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:bg-gray-400"
                        disabled={loading}
                    >
                        {loading ? 'Registrando...' : 'Registrarme'}
                    </button>
                </div>
                
                <div className="mt-4 text-center">
                    <button onClick={() => router.push('/')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                        ¿Ya tienes cuenta? Inicia sesión aquí.
                    </button>
                </div>
            </div>
        </div>
    );
}