import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'

const ProductItem = ({ id, image, name, price }) => {

    const { currency, backendUrl } = useContext(ShopContext);

    return (
        <Link className='cursor-pointer group' to={`/product/${id}`}>
            <div className='medical-card overflow-hidden p-3 bg-white'>
                <div className='overflow-hidden rounded-xl bg-slate-50'>
                    <img className='group-hover:scale-110 transition duration-500 w-full h-48 object-contain p-4' src={Array.isArray(image) ? backendUrl + '/' + image[0] : backendUrl + '/' + image} alt="" />
                </div>
                <div className='pt-4 pb-2'>
                    <p className='text-slate-800 font-semibold truncate text-base mb-1 group-hover:text-primary transition-colors'>{name}</p>
                    <p className='text-primary font-bold text-lg'>{currency}{price}</p>
                </div>
            </div>
        </Link>
    )
}

export default ProductItem
