import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import { Search, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const SearchBar = () => {

    const { search, setSearch, showSearch, setShowSearch } = useContext(ShopContext);
    const location = useLocation();

    return showSearch && location.pathname.includes('collection') ? (
        <div className='bg-white border-b border-gray-100 flex items-center justify-center py-3 px-6 md:px-14 transition-all duration-300'>
            <div className='flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg w-full max-w-2xl border border-gray-200 focus-within:border-primary transition-all'>
                <Search className='w-4 h-4 text-gray-400' />
                <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='flex-1 outline-none bg-transparent text-[13px] text-gray-700 placeholder:text-gray-400'
                    type="text"
                    placeholder='Search for products...'
                />
                <X
                    onClick={() => setShowSearch(false)}
                    className='w-4 h-4 cursor-pointer text-gray-400 hover:text-red-500 transition-colors'
                />
            </div>
        </div>
    ) : null
}

export default SearchBar
