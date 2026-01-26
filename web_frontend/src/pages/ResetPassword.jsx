import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useSearchParams } from 'react-router-dom';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

const ResetPassword = () => {
    const { backendUrl, navigate } = useContext(ShopContext);
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('Invalid or missing reset token');
            navigate('/login');
        }
    }, [token, navigate]);

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~])[A-Za-z\d!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            toast.error("Password must serve security requirements.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(backendUrl + '/api/user/reset-password', { token, newPassword });
            if (response.data.success) {
                toast.success(response.data.message);
                navigate('/login');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
            <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
                <p className='text-2xl font-semibold'>Reset Password</p>
                <p className='text-gray-500 mb-2'>Enter your new password below.</p>

                <div className='w-full'>
                    <p>New Password</p>
                    <div className='relative'>
                        <input
                            className='border border-zinc-300 rounded w-full p-2 mt-1'
                            type={showPassword ? "text" : "password"}
                            onChange={(e) => setNewPassword(e.target.value)}
                            value={newPassword}
                            required
                            placeholder='New password'
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-[60%] -translate-y-1/2 text-gray-500"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className='w-full'>
                    <p>Confirm Password</p>
                    <input
                        className='border border-zinc-300 rounded w-full p-2 mt-1'
                        type={showPassword ? "text" : "password"}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        value={confirmPassword}
                        required
                        placeholder='Confirm new password'
                    />
                </div>

                <PasswordStrengthMeter password={newPassword} />

                <button
                    type="submit"
                    disabled={loading}
                    className='bg-primary text-white w-full py-2 rounded-md text-base mt-2 disabled:bg-gray-400'
                >
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </div>
        </form>
    )
}

export default ResetPassword
