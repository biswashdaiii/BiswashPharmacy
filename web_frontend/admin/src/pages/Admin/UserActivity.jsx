import React, { useEffect, useState, useContext } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'

const UserActivity = () => {
    const { userId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { backendUrl, aToken } = useContext(AdminContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const userName = location.state?.userName || "User";

    const fetchUserLogs = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/admin/user-activity/${userId}`, {
                headers: { aToken }
            });
            if (response.data.success) {
                setLogs(response.data.logs);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch activity logs");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (aToken) {
            fetchUserLogs();
        }
    }, [aToken, userId]);

    const getEventColor = (event) => {
        if (event.includes('FAILURE') || event.includes('DENIED') || event.includes('LOCKED')) return 'text-red-600 bg-red-50';
        if (event.includes('SUCCESS') || event.includes('LOGGED_IN')) return 'text-green-600 bg-green-50';
        if (event.includes('ATTEMPT') || event.includes('WAITING')) return 'text-yellow-600 bg-yellow-50';
        return 'text-blue-600 bg-blue-50';
    };

    return (
        <div className="p-4 md:p-0">
            <div className='flex items-center gap-4 mb-6'>
                <button
                    onClick={() => navigate('/user-list')}
                    className='bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors'
                >
                    ⬅️
                </button>
                <h2 className='text-2xl font-semibold text-[#007E85] uppercase'>Activity Logs: {userName}</h2>
            </div>

            {loading ? (
                <div className='flex justify-center p-20'>
                    <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#007E85]'></div>
                </div>
            ) : (
                <div className='bg-white rounded-xl shadow-sm border overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left border-collapse'>
                            <thead>
                                <tr className='bg-gray-50 border-b text-sm font-bold text-gray-700'>
                                    <th className='py-4 px-6'>Timestamp</th>
                                    <th className='py-4 px-6'>Event/Action</th>
                                    <th className='py-4 px-6'>IP Address</th>
                                    <th className='py-4 px-6'>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? (
                                    logs.map((log, index) => (
                                        <tr key={index} className='border-b hover:bg-gray-50 transition-colors text-sm'>
                                            <td className='py-4 px-6 text-gray-500 font-mono text-[12px]'>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className='py-4 px-6'>
                                                <span className={`px-3 py-1 rounded-md text-[11px] font-bold ${getEventColor(log.event || log.action)}`}>
                                                    {log.event || log.action}
                                                </span>
                                            </td>
                                            <td className='py-4 px-6 text-gray-600 font-mono text-[12px]'>
                                                {log.ip || 'N/A'}
                                            </td>
                                            <td className='py-4 px-6'>
                                                <div className='text-[12px] text-gray-500 max-w-xs truncate' title={JSON.stringify(log)}>
                                                    {log.path ? `Path: ${log.path}` : ''}
                                                    {log.attempts ? `Attempts: ${log.attempts}` : ''}
                                                    {log.error ? `Error: ${log.error}` : ''}
                                                    {!log.path && !log.attempts && !log.error ? 'Activity recorded' : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className='py-20 text-center text-gray-400'>
                                            No recent activity logs found for this user.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserActivity
