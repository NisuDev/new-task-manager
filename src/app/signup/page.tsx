// src/app/signup/page.tsx
'use client' 

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Asegúrate de que la ruta sea correcta
import { useRouter } from 'next/navigation'; // <-- CORREGIDO: Usar 'from' en lugar de '='

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
            // 1. Usa signUp para crear un nuevo usuario en Supabase Auth
            const { 
                data: authData,
                error: authError
            } = await supabase.auth.signUp({ 
                email: email, 
                password: password 
            });

            if (authError) {
                alert('Error al registrar usuario en Auth: ' + authError.message);
                return;
            }
            
            if (authData.user) {
                // NOTA IMPORTANTE: La tabla 'user' en tu esquema (SERIAL ID, USER_NAME, PASSWORD)
                // no está diseñada para guardar el UUID de Auth o el email de forma segura.
                // Insertaremos los datos para que "se guarde algo", pero
                // considera actualizar el esquema de tu tabla 'user' a un formato de perfil con UUID.
                
                // 2. Insertar una entrada en la tabla 'user' (Tu tabla de datos)
                // Asumiendo que quieres guardar el email en el campo USER_NAME
                const { error: userTableError } = await supabase
                    .from('user') 
                    .insert({ 
                        // Guardamos el email en USER_NAME
                        USER_NAME: email, 
                        // Guardamos un placeholder, ya que la contraseña real está en Auth
                        PASSWORD: 'Supabase-Managed-Password-Hash' 
                    });
                
                if (userTableError) {
                    console.error("Error al crear perfil en la DB (tabla 'user'):", userTableError);
                    alert('Registro exitoso en Auth, pero falló la creación del perfil en la DB: ' + userTableError.message);
                    return;
                }

                // 3. Manejar la redirección
                 if (authData.session) {
                    // Usuario creado y logueado (si la configuración de Supabase lo permite)
                    alert('¡Registro y perfil creados! Redirigiendo a tareas...');
                    router.push('/tasks'); 
                } else {
                    // Usuario creado, pero necesita confirmar email (configuración por defecto de Supabase)
                    alert('¡Registro y perfil creados! Por favor, revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.');
                    router.push('/'); // Redirige al login
                }
            }

        } catch (e) {
            console.error("Signup failed", e);
            alert('Ocurrió un error inesperado al intentar registrarse.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Registro de Nuevo Usuario</h2>
                
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        disabled={loading}
                    />
                </div>
                
                <div className="text-center">
                    <button
                        onClick={handleSignup}
                        className="w-full px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded-md shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                        disabled={loading}
                    >
                        {loading ? 'Registrando...' : 'Registrarme'}
                    </button>
                </div>
                
                <div className="mt-4 text-center">
                    <button onClick={() => router.push('/')} className="text-sm text-blue-600 hover:text-blue-500">
                        ¿Ya tienes cuenta? Inicia sesión aquí.
                    </button>
                </div>
            </div>
        </div>
    );
}