import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [show, setShow] = useState(false);

    // Fade-in animation on mount
    useState(() => {
        setTimeout(() => setShow(true), 50);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        fetch('http://localhost:5001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(data => { throw new Error(data.message); });
            }
            return res.json();
        })
        .then(data => {
            localStorage.setItem('user', JSON.stringify(data.user));
            // Reload the page to trigger App component re-render and redirect
            window.location.href = '/dashboard';
        })
        .catch(err => {
            setMessage(err.message);
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-white to-blue-200">
            {/* Nexus Track header - top left on desktop, centered on mobile */}
            <div className="hidden md:flex justify-start items-start py-8 px-12">
                <h1 className="text-4xl font-extrabold tracking-tight text-blue-600 drop-shadow">Nexus Track</h1>
            </div>
            <div className="md:hidden flex justify-center items-center py-8 w-full">
                <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 drop-shadow">Nexus Track</h1>
            </div>
            <div className="flex-1 flex justify-center items-center">
                <div className={`bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md transition-all duration-500 ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
                    style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}>
                    <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-800 drop-shadow">Welcome Back</h2>
                    {message && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center animate-fade-in">{message}</div>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400 bg-white/80"
                                required
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400 bg-white/80"
                                required
                            />
                        </div>
                        <button className="w-full bg-gradient-to-tr from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white p-4 rounded-xl font-bold shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg">
                            Sign In
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <span className="text-gray-600">Don't have an account? </span>
                        <Link className="text-blue-600 font-semibold hover:underline" to="/register">Create one</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;