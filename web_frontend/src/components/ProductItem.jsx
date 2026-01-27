import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'

const ProductItem = ({ id, image, name, price }) => {

    const { currency, backendUrl } = useContext(ShopContext);

    return (
        <Link className='cursor-pointer group' to={`/product/${id}`}>
            <div className='bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-4 flex flex-col h-full'>
                <div className='relative overflow-hidden rounded-xl bg-gray-50 aspect-square flex items-center justify-center p-6'>
                    <img
                        className='group-hover:scale-110 transition-transform duration-700 w-full h-full object-contain mix-blend-multiply'
                        src={Array.isArray(image) ? `${backendUrl}/${image[0]}` : `${backendUrl}/${image}`}
                        alt={name}
                    />
                    <div className='absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
                        <span className='bg-white text-primary text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 uppercase'>Quick View</span>
                    </div>
                </div>
                <div className='pt-4 flex flex-col justify-between flex-grow'>
                    <div>
                        <p className='text-gray-700 font-medium text-[13px] line-clamp-2 leading-tight group-hover:text-primary transition-colors mb-1.5'>{name}</p>
                    </div>
                    <div className='flex items-center justify-between mt-auto'>
                        <p className='text-primary font-semibold text-base'>{currency}{price.toLocaleString()}</p>
                        <div className='w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-gray-400'>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default ProductItem
