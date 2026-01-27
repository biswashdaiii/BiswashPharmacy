import React, { useEffect, useState, useContext } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { useNavigate } from 'react-router-dom'

const UserList = () => {
    const { backendUrl, aToken } = useContext(AdminContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/user/all', { headers: { aToken } });
            if (response.data) {
                // The backend returns users directly as an array or {success, users}
                // Based on userController, it returns res.status(200).json(users);
                setUsers(Array.isArray(response.data) ? response.data : response.data.users || []);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (aToken) {
            fetchUsers();
        }
    }, [aToken]);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (aToken) {
            fetchUsers();
        }
    }, [aToken]);

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-gray-800 uppercase tracking-tight">User Management</h1>
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#007E85] border-gray-200 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007E85]"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-[0.5fr_2fr_2fr_1fr_1.5fr] items-center gap-4 py-4 px-6 bg-gray-50 border-b text-sm font-bold text-gray-700 uppercase tracking-wider">
                        <span>#</span>
                        <span>User</span>
                        <span>Contact Info</span>
                        <span>Role</span>
                        <span className="text-center">Actions</span>
                    </div>

                    {/* User List */}
                    <div className="divide-y divide-gray-100">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((item, index) => (
                                <div
                                    className="grid grid-cols-1 md:grid-cols-[0.5fr_2fr_2fr_1fr_1.5fr] items-center gap-4 py-4 px-6 hover:bg-gray-50 transition-colors text-sm text-gray-600 group"
                                    key={item._id}
                                >
                                    <span className="hidden md:block font-medium text-gray-400">{index + 1}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                src={item.profileImage || "https://via.placeholder.com/48"}
                                                alt={item.name}
                                            />
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${item.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-gray-400 md:hidden">{item.email}</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="font-medium text-gray-600 truncate">{item.email}</p>
                                    </div>
                                    <div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.role === 'admin'
                                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                                            }`}>
                                            {item.role || 'User'}
                                        </span>
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => navigate(`/user-activity/${item._id}`, { state: { userName: item.name } })}
                                            className="bg-white border border-[#007E85] text-[#007E85] hover:bg-[#007E85] hover:text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 active:scale-95"
                                        >
                                            View Logs
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <p className="text-gray-400 font-medium">No users found matching your search</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserList
