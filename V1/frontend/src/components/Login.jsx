import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

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
            navigate('/dashboard');
        })
        .catch(err => {
            setMessage(err.message);
        });
    };

    return (
        <div className="flex justify-center items-center h-screen bg-blue-500">
            <div className="bg-white p-8 rounded-xl shadow-md w-96">
                <h2 className="text-2xl font-semibold mb-4 text-center">Welcome Back</h2>
                {message && <div className="bg-red-100 text-red-700 p-2 rounded">{message}</div>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full mb-4 p-3 border rounded"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full mb-4 p-3 border rounded"
                        required
                    />
                    <button className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
                        Sign In
                    </button>
                </form>
                <div className="mt-4 text-center">
                    Don't have an account? <Link className="text-blue-600" to="/register">Create one</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;