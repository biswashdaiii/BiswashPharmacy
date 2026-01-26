import React, { useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ForgotPassword = () => {
    const { backendUrl, navigate } = useContext(ShopContext);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(backendUrl + '/api/user/forgot-password', { email });
            if (response.data.success) {
                toast.success(response.data.message);
                // navigate('/login'); // Optional: stay on page or navigate
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
                <p className='text-2xl font-semibold'>Forgot Password</p>
                <p className='text-gray-500 mb-2'>Enter your email address to receive a password reset link.</p>

                <div className='w-full'>
                    <p>Email</p>
                    <input
                        className='border border-zinc-300 rounded w-full p-2 mt-1'
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        required
                        placeholder='Enter your registered email'
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className='bg-primary text-white w-full py-2 rounded-md text-base mt-2 disabled:bg-gray-400'
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <div className='w-full text-center mt-2'>
                    <span onClick={() => navigate('/login')} className='text-primary underline cursor-pointer'>
                        Back to Login
                    </span>
                </div>
            </div>
        </form>
    )
}

export default ForgotPassword
