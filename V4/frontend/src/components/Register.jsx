import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FEATURES = [
  'SEO Audit',
  'Backlink Checker',
  'Keyword Research',
  'Site Monitoring',
  'Competitor Analysis',
  'Page Speed Insights',
  'Content Optimization',
  'Rank Tracking',
  'Mobile Usability',
  'Sitemap Management',
];

function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: email, 2: OTP verification
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [show, setShow] = useState(false);
    const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    // Fade-in animation on mount
    useState(() => {
        setTimeout(() => setShow(true), 50);
    }, []);

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

    const handleOtpChange = (e, idx) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (!val) {
            // If empty, just clear this box
            setOtp((prev) => {
                const arr = [...prev];
                arr[idx] = '';
                return arr;
            });
            return;
        }
        if (val.length === 1) {
            setOtp((prev) => {
                const arr = [...prev];
                arr[idx] = val;
                return arr;
            });
            // Move to next box
            if (idx < 5) otpRefs[idx + 1].current.focus();
        } else if (val.length > 1) {
            // Paste or fast typing
            const chars = val.split('').slice(0, 6 - idx);
            setOtp((prev) => {
                const arr = [...prev];
                chars.forEach((c, i) => {
                    arr[idx + i] = c;
                });
                return arr;
            });
            if (idx + chars.length - 1 < 5) otpRefs[idx + chars.length - 1].current.focus();
        }
    };

    const handleOtpKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            otpRefs[idx - 1].current.focus();
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        const otpValue = otp.join('');

        try {
            const response = await fetch('http://localhost:5001/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpValue, name, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage('Registration successful!');
                setRegistrationSuccess(true);
                // Save user data including ID to localStorage
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    // Redirect to dashboard after successful registration
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                }
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
                setMessage('OTP resent successfully! Check your email.');
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
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-100 via-white to-blue-200">
            {/* Left side - Header and Registration */}
            <div className="flex-1 flex flex-col">
                {/* Nexus Track header - left top */}
                <div className="md:flex justify-start items-start py-8 px-12">
                    <h1 className="text-4xl font-extrabold tracking-tight text-blue-600 drop-shadow">Nexus Track</h1>
                </div>
                
                {/* Registration card */}
                <div className="flex-1 flex justify-center items-center py-12 px-8">
                    <div className={`bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md transition-all duration-500 ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
                        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}>
                        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-800 drop-shadow">
                            {step === 1 ? 'Create Account' : 'Verify Email'}
                        </h2>
                        {message && (
                            <div className={`p-2 rounded mb-4 text-center animate-fade-in ${
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
                            <form onSubmit={e => {
                                e.preventDefault();
                                setMessage('');
                                if (password !== confirmPassword) {
                                    setMessage('Passwords do not match.');
                                    return;
                                }
                                handleSendOTP(e);
                            }} className="space-y-6">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-4 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400 bg-white/80"
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-4 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400 bg-white/80"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-4 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400 bg-white/80"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-4 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400 bg-white/80"
                                    required
                                />
                                <button 
                                    type="submit" 
                                    className="w-full bg-gradient-to-tr from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white p-4 rounded-xl font-bold shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Enter the 6-digit code sent to <strong>{email}</strong>
                                    </p>
                                    <div className="flex justify-center gap-2">
                                        {otp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={otpRefs[idx]}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={e => handleOtpChange(e, idx)}
                                                onKeyDown={e => handleOtpKeyDown(e, idx)}
                                                className="w-12 h-14 text-center text-2xl font-mono border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white/80"
                                                required
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full bg-gradient-to-tr from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white p-4 rounded-xl font-bold shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg mb-3"
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Register'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleResendOTP}
                                    className="w-full bg-blue-100 text-blue-700 p-4 rounded-xl font-bold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-100 mb-3"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Resend OTP'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full bg-gray-200 text-gray-700 p-4 rounded-xl font-bold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                >
                                    Back to Details
                                </button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <span className="text-gray-600">Already have an account? </span>
                            <Link className="text-blue-600 font-semibold hover:underline" to="/">Sign in</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Blue box with image */}
            <div className="hidden md:flex flex-col justify-between bg-blue-600 text-white px-12 w-1/2 min-h-screen rounded-tl-3xl rounded-bl-3xl shadow-xl relative overflow-hidden">
                {/* Background image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{
                        backgroundImage: 'url(https://i.pinimg.com/736x/01/f3/d5/01f3d5cfaf073906816d3a34db3a914a.jpg)'
                    }}
                ></div>
                {/* SEO Automation Platform header at the top */}
                <div className="relative z-10 w-full pt-12 pb-4 flex flex-col items-center">
                    <h2 className="text-3xl font-bold drop-shadow">SEO Automation Platform</h2>
                </div>
                {/* Marquee animation at the bottom */}
                <div className="relative z-10 w-full pb-12 flex flex-col items-center">
                  <div className="w-full overflow-hidden h-10">
                    <div className="marquee-track flex gap-12 text-blue-100/90 text-lg font-semibold">
                      {FEATURES.concat(FEATURES).map((feature, idx) => (
                        <span key={idx}>{feature}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Marquee animation keyframes for seamless infinite scroll */}
                <style>{`
                  .marquee-track {
                    display: flex;
                    width: max-content;
                    animation: marquee-infinite 18s linear infinite;
                  }
                  @keyframes marquee-infinite {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                `}</style>
            </div>

            {/* Mobile header */}
            <div className="md:hidden flex justify-center items-center py-8 bg-blue-600 text-white w-full">
                <h1 className="text-3xl font-extrabold tracking-tight drop-shadow">Nexus Track</h1>
            </div>
        </div>
    );
}

export default Register;
