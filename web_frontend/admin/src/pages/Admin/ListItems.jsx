import React, { useEffect, useState, useContext } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { currency } from '../../App'
import { assets } from '../../assets/assets'

const ListItems = ({ token }) => {

    const { backendUrl, aToken } = useContext(AdminContext);
    const [list, setList] = useState([]);

    const fetchList = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list')
            if (response.data.success) {
                setList(response.data.products.reverse());
            }
            else {
                toast.error(response.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const removeProduct = async (id) => {
        try {
            const response = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { aToken } })
            if (response.data.success) {
                toast.success(response.data.message)
                await fetchList();
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const [searchTerm, setSearchTerm] = useState('');

    const filteredList = list.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        fetchList()
    }, [])

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-gray-800 uppercase tracking-tight">Product Inventory</h1>
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Search products..."
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* List Table Title */}
                <div className="hidden md:grid grid-cols-[0.8fr_3fr_1.5fr_1fr_1fr] items-center gap-4 py-4 px-6 bg-gray-50 border-b text-sm font-bold text-gray-700 uppercase tracking-wider">
                    <span>Product</span>
                    <span>Name</span>
                    <span>Category</span>
                    <span>Price</span>
                    <span className="text-center">Action</span>
                </div>

                {/* Product List */}
                <div className="divide-y divide-gray-100">
                    {filteredList.length > 0 ? (
                        filteredList.map((item, index) => (
                            <div
                                className="grid grid-cols-[0.8fr_3fr_1fr] md:grid-cols-[0.8fr_3fr_1.5fr_1fr_1fr] items-center gap-4 py-4 px-6 hover:bg-gray-50 transition-colors text-sm text-gray-600 group"
                                key={index}
                            >
                                <div className="flex-shrink-0">
                                    <img
                                        className="w-14 h-14 object-cover rounded-lg border border-gray-100 shadow-sm"
                                        src={Array.isArray(item.image) ? `${backendUrl}/${item.image[0]}` : `${backendUrl}/${item.image || item}`}
                                        alt={item.name}
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-gray-400 md:hidden">{item.category}</p>
                                </div>
                                <div className="hidden md:block">
                                    <span className="bg-[#E6F4F5] text-[#007E85] px-2.5 py-1 rounded-full text-[11px] font-bold uppercase">
                                        {item.category}
                                    </span>
                                </div>
                                <div className="font-bold text-gray-800">
                                    {currency}{item.price.toLocaleString()}
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => removeProduct(item._id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                                        title="Delete Product"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-gray-400 font-medium">No products found matching your search</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ListItems
