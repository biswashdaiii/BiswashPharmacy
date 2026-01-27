import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';

const SecurityLogs = () => {
    const { aToken, backendUrl } = useContext(AdminContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/admin/security-logs`, {
                headers: { Authorization: `Bearer ${aToken}` }
            });

            if (response.data.success) {
                setLogs(response.data.logs);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Failed to fetch security logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (aToken) {
            fetchLogs();
        }
    }, [aToken]);

    const filteredLogs = logs.filter(log =>
        log.event?.toLowerCase().includes(filter.toLowerCase()) ||
        log.action?.toLowerCase().includes(filter.toLowerCase()) ||
        log.email?.toLowerCase().includes(filter.toLowerCase()) ||
        log.ip?.toLowerCase().includes(filter.toLowerCase())
    );

    const getEventColor = (event) => {
        if (event?.includes('FAILURE') || event?.includes('DENIED') || event?.includes('LOCKED')) return 'text-red-600';
        if (event?.includes('SUCCESS') || event?.includes('VERIFIED')) return 'text-green-600';
        if (event?.includes('ATTEMPT')) return 'text-orange-600';
        return 'text-blue-600';
    };

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-gray-800 uppercase tracking-tight">Security Audit Logs</h1>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-80">
                        <input
                            type="text"
                            placeholder="Filter by event, email, or IP..."
                            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#007E85] border-gray-200 transition-all shadow-sm"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="bg-white border border-gray-200 text-gray-600 p-2 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                        title="Refresh Logs"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="sticky top-0 z-10 text-xs uppercase bg-gray-50 text-gray-500 font-bold border-b">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Event / Action</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">IP Address</th>
                                <th className="px-6 py-4 whitespace-nowrap">Context Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007E85]"></div>
                                            <p className="text-gray-400 font-medium">Fetching secure logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center flex flex-col items-center justify-center gap-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-400 font-medium">No security events found in history</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-medium text-[12px]">
                                            {new Date(log.timestamp).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${(log.event || log.action)?.includes('FAILURE') || (log.event || log.action)?.includes('DENIED') || (log.event || log.action)?.includes('LOCKED')
                                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                                    : (log.event || log.action)?.includes('SUCCESS') || (log.event || log.action)?.includes('VERIFIED') || (log.event || log.action)?.includes('LOGGED_IN')
                                                        ? 'bg-green-50 text-green-600 border border-green-100'
                                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                {(log.event || log.action || 'N/A').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <p className="font-bold text-gray-700 leading-none">{log.email || 'System'}</p>
                                                {log.userId && <span className="text-[10px] text-gray-400 mt-1 font-mono">ID: {log.userId}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                {log.ip || 'Local'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="text-gray-500 line-clamp-2 italic text-xs hover:line-clamp-none transition-all" title={JSON.stringify(log)}>
                                                {log.errors ? log.errors.join(', ') : log.message || log.alertReason || '-'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SecurityLogs;
