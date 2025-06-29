import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: email, 2: OTP verification
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5001/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage('OTP sent successfully! Check your email.');
                setStep(2);
            } else {
                setMessage(data.message);
            }
        } catch (err) {
            setMessage('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5001/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, name, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage('Registration successful! Redirecting to login...');
                setRegistrationSuccess(true);
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } else {
                setMessage(data.message);
            }
        } catch (err) {
            setMessage('Failed to verify OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5001/api/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage('OTP resent successfully!');
            } else {
                setMessage(data.message);
            }
        } catch (err) {
            setMessage('Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-blue-500">
            <div className="bg-white p-8 rounded-xl shadow-md w-96">
                <h2 className="text-2xl font-semibold mb-4 text-center">
                    {step === 1 ? 'Create Account' : 'Verify Email'}
                </h2>
                
                {message && (
                    <div className={`p-2 rounded mb-4 ${
                        message.includes('successfully') || message.includes('successful') 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                    }`}>
                        {message}
                        {registrationSuccess && (
                            <div className="mt-2">
                                <button 
                                    onClick={() => navigate('/')}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Go to Login
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendOTP}>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full mb-4 p-3 border rounded"
                            required
                        />
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
                        <button 
                            type="submit" 
                            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP}>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Enter the 6-digit code sent to <strong>{email}</strong>
                            </p>
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full p-3 border rounded text-center text-lg font-mono"
                                maxLength={6}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50 mb-3"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Verify & Register'}
                        </button>
                        <button 
                            type="button"
                            onClick={handleResendOTP}
                            className="w-full bg-gray-400 text-white p-3 rounded hover:bg-gray-500 disabled:opacity-50 mb-3"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Resend OTP'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full bg-gray-200 text-gray-700 p-3 rounded hover:bg-gray-300"
                        >
                            Back to Details
                        </button>
                    </form>
                )}

                <div className="mt-4 text-center">
                    Already have an account? <Link className="text-blue-600" to="/">Sign in</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
