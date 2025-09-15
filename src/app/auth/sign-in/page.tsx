

'use client'
import { useState } from 'react'
import { signIn } from '@/app/utils/Auth'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/app/lib/supabase_client'

export default function SigninPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter();

    const handleSignin = async () => {
        if (!email || !password) return alert('All fields are required!')

        setLoading(true)
        const { data, error } = await signIn(email, password)
        setLoading(false)

        if (error) return alert(error.message)

        const session = data.session;
        if (session?.access_token && session?.refresh_token) {
            await supabaseClient.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
            })
        }

        alert('Signin successful!')
        router.push('/')
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-purple-50 via-pink-50 to-white">
            
            {/* Left Section */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-purple-600 to-pink-500 items-center justify-center p-12 text-white">
                <div className="max-w-lg text-center">
                    <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Welcome Back!</h1>
                    <p className="text-lg opacity-90">
                        Stay focused, schedule smart, and grind in silence. Your productivity hub awaits.
                    </p>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-1 items-center justify-center p-6">
                <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-gray-100">
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Sign In</h2>

                    <div className="flex flex-col gap-5">
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="border border-gray-300 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="border border-gray-300 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />

                        <button
                            onClick={handleSignin}
                            disabled={loading}
                            className="w-full py-3 bg-pink-600 text-white font-semibold rounded-2xl shadow hover:bg-pink-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </div>

                   <p>Don&apos;t have an Account? <a href="/auth/sign-up">Register</a></p>

                </div>
            </div>
        </div>
    )
}
