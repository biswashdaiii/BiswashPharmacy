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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Security Audit Logs</h1>
                <button
                    onClick={fetchLogs}
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition"
                >
                    Refresh Logs
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Filter by event, email, or IP..."
                        className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-primary"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                            <tr>
                                <th className="px-6 py-3">Timestamp</th>
                                <th className="px-6 py-3">Event/Action</th>
                                <th className="px-6 py-3">Email/User</th>
                                <th className="px-6 py-3">IP Address</th>
                                <th className="px-6 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-4 text-center">Loading logs...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-4 text-center">No logs found</td></tr>
                            ) : (
                                filteredLogs.map((log, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className={`px-6 py-4 font-semibold uppercase ${getEventColor(log.event || log.action)}`}>
                                            {log.event || log.action || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.email || log.userId || 'System'}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {log.ip || 'Local'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs truncate" title={JSON.stringify(log)}>
                                                {log.errors ? log.errors.join(', ') : log.message || '-'}
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
