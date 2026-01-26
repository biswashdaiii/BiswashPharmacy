import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'

const ForgotPassword = () => {
    const { backendUrl, navigate } = useContext(ShopContext);
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const onEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(backendUrl + '/api/user/forgot-password', { email });
            if (response.data.success) {
                toast.success(response.data.message);
                setStep(2);
                setTimer(60); // 60s cooldown for resend
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    }

    const onOTPSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(backendUrl + '/api/user/verify-reset-otp', { email, otp });
            if (response.data.success) {
                toast.success(response.data.message);
                setStep(3);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid or expired code');
        } finally {
            setLoading(false);
        }
    }

    const onPasswordSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }
        setLoading(true);
        try {
            const response = await axios.post(backendUrl + '/api/user/reset-password', { email, otp, newPassword });
            if (response.data.success) {
                toast.success(response.data.message);
                navigate('/login');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    }

    const handleResendOTP = async () => {
        if (timer > 0) return;
        setLoading(true);
        try {
            const response = await axios.post(backendUrl + '/api/user/forgot-password', { email });
            if (response.data.success) {
                toast.success("New reset code sent successfully");
                setTimer(60);
            }
        } catch (error) {
            toast.error("Failed to resend code");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='min-h-[80vh] flex items-center justify-center p-4'>
            <div className='bg-white flex flex-col gap-4 items-start p-8 w-full max-w-md border rounded-xl text-zinc-600 text-sm shadow-lg'>

                {/* Header Section */}
                <div className='w-full text-center space-y-2 mb-4'>
                    <p className='text-3xl font-bold text-gray-800'>Account Recovery</p>
                    <div className='flex justify-center gap-2'>
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`h-2 w-12 rounded-full transition-all duration-300 ${step >= s ? 'bg-primary' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </div>

                {/* Step 1: Email Input */}
                {step === 1 && (
                    <form onSubmit={onEmailSubmit} className='w-full space-y-4 transition-all duration-300'>
                        <p className='text-gray-500'>Enter your registered email address to receive a 6-digit recovery code.</p>
                        <div className='space-y-1'>
                            <p className='font-medium'>Email Address</p>
                            <input
                                className='border border-zinc-300 rounded w-full p-3 focus:border-primary outline-none'
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder='example@mail.com'
                            />
                        </div>
                        <button type="submit" disabled={loading} className='bg-primary text-white w-full py-3 rounded-lg text-base font-semibold hover:bg-opacity-90 transition disabled:bg-gray-300'>
                            {loading ? 'Processing...' : 'Send Recovery Code'}
                        </button>
                        <div className='w-full text-center pt-2'>
                            <p onClick={() => navigate('/login')} className='text-primary hover:underline cursor-pointer font-medium'>Back to Login</p>
                        </div>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <form onSubmit={onOTPSubmit} className='w-full space-y-4 animate-in fade-in slide-in-from-right-4 duration-300'>
                        <p className='text-gray-500'>We sent a recovery code to <span className='text-gray-800 font-medium'>{email}</span>. Please enter it below.</p>
                        <div className='space-y-1'>
                            <p className='font-medium'>6-Digit Code</p>
                            <input
                                className='border border-zinc-300 rounded w-full p-4 text-center text-3xl tracking-[1em] focus:border-primary outline-none font-mono'
                                type="text"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                required
                                placeholder='000000'
                            />
                        </div>
                        <button type="submit" disabled={loading} className='bg-primary text-white w-full py-3 rounded-lg text-base font-semibold hover:bg-opacity-90 transition disabled:bg-gray-300'>
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <div className='w-full text-center space-y-3 pt-2'>
                            <p className='text-gray-400 text-xs'>Didn't receive the code?</p>
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={timer > 0 || loading}
                                className={`text-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline`}
                            >
                                {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
                            </button>
                            <p onClick={() => setStep(1)} className='text-gray-400 hover:text-gray-600 cursor-pointer block text-xs underline'>Change Email</p>
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={onPasswordSubmit} className='w-full space-y-4 animate-in fade-in slide-in-from-right-4 duration-300'>
                        <p className='text-gray-500'>Finally, choose a strong new password for your account.</p>

                        <div className='space-y-1'>
                            <p className='font-medium'>New Password</p>
                            <div className='relative'>
                                <input
                                    className='border border-zinc-300 rounded w-full p-3 focus:border-primary outline-none'
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder='Minimum 8 characters'
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94a10.07 10.07 0 0 1-5.94 2.06c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    )}
                                </button>
                            </div>
                            <PasswordStrengthMeter password={newPassword} />
                        </div>

                        <div className='space-y-1'>
                            <p className='font-medium'>Confirm Password</p>
                            <input
                                className='border border-zinc-300 rounded w-full p-3 focus:border-primary outline-none'
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder='Confirm your new password'
                            />
                        </div>

                        <button type="submit" disabled={loading} className='bg-primary text-white w-full py-3 rounded-lg text-base font-semibold hover:bg-opacity-90 transition disabled:bg-gray-300'>
                            {loading ? 'Updating Password...' : 'Reset Password'}
                        </button>
                    </form>
                )}

            </div>
        </div>
    )
}

export default ForgotPassword
