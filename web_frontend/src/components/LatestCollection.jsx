import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import ProductItem from './ProductItem';

const LatestCollection = () => {

    const { products } = useContext(ShopContext);
    const [latestProducts, setLatestProducts] = useState([]);

    useEffect(() => {
        setLatestProducts(products.slice(0, 8));
    }, [products])

    return (
        <div className='my-20 px-4 sm:px-0'>
            <div className='text-center py-10'>
                <Title text1={'LATEST'} text2={'COLLECTIONS'} />
                <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-500 font-medium max-w-2xl'>
                    Discover our newest arrivals in healthcare and personal care. From prescriptions to daily wellness, we bring quality to your doorstep.
                </p>
            </div>

            {/* Rendering Products */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-10'>
                {
                    latestProducts.map((item, index) => (
                        <div key={item._id || index} className="animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                            <ProductItem id={item._id} image={item.image} name={item.name} price={item.price} />
                        </div>
                    ))
                }
            </div>

            <div className="flex justify-center mt-16">
                <button
                    onClick={() => window.location.href = '/collection'}
                    className="group bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white px-10 py-3 rounded-full font-black text-sm transition-all duration-300 shadow-md hover:shadow-xl active:scale-95 flex items-center gap-2"
                >
                    View Entire Catalog
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default LatestCollection
