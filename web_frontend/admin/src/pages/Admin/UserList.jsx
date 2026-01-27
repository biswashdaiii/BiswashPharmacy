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

    return (
        <div className="p-4 md:p-0">
            <h2 className='pb-4 text-2xl font-semibold text-[#007E85] uppercase'>User Management</h2>

            {loading ? (
                <p>Loading users...</p>
            ) : (
                <div className='flex flex-col gap-3'>
                    {/* Table Header */}
                    <div className='hidden md:grid grid-cols-[0.5fr_2fr_2fr_1fr_1.5fr] items-center gap-4 py-3 px-6 border bg-gray-50 text-sm font-bold text-gray-700 rounded-t-lg'>
                        <span>#</span>
                        <span>Name</span>
                        <span>Email</span>
                        <span>Role</span>
                        <span className='text-center'>Actions</span>
                    </div>

                    {/* User List */}
                    {users.length > 0 ? (
                        users.map((item, index) => (
                            <div
                                className='grid grid-cols-1 md:grid-cols-[0.5fr_2fr_2fr_1fr_1.5fr] items-center gap-4 py-3 px-6 border border-t-0 bg-white hover:bg-gray-50 transition-colors text-sm text-gray-600'
                                key={item._id}
                            >
                                <span className='hidden md:block'>{index + 1}</span>
                                <div className='flex items-center gap-3'>
                                    <img
                                        className='w-10 h-10 rounded-full object-cover border'
                                        src={item.profileImage || "https://via.placeholder.com/40"}
                                        alt=""
                                    />
                                    <p className='font-medium text-gray-800'>{item.name}</p>
                                </div>
                                <p className='truncate'>{item.email}</p>
                                <div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {item.role}
                                    </span>
                                </div>
                                <div className='flex justify-center'>
                                    <button
                                        onClick={() => navigate(`/user-activity/${item._id}`, { state: { userName: item.name } })}
                                        className='bg-[#007E85] hover:bg-[#00646a] text-white px-4 py-1.5 rounded text-xs font-semibold shadow-sm transition-all'
                                    >
                                        View Activity
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className='p-10 text-center border bg-white rounded-b-lg'>
                            <p className='text-gray-400'>No users found in the system.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default UserList
