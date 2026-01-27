import React from 'react'
import { ShieldCheck, Truck, HeadphonesIcon } from 'lucide-react'

const OurPolicy = () => {
    return (
        <div className='flex flex-col sm:flex-row justify-around gap-12 sm:gap-4 text-center py-20 bg-gray-50/50 rounded-3xl my-20 border border-gray-100'>
            <div className="hover:scale-105 transition-transform duration-300">
                <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center m-auto mb-5 shadow-sm border border-gray-100">
                    <Truck className='w-8 h-8 text-primary' />
                </div>
                <p className='font-black text-gray-800 uppercase tracking-tighter'>Express Delivery</p>
                <p className='text-gray-500 text-xs font-medium'>Get your medicines within 24 hours.</p>
            </div>
            <div className="hover:scale-105 transition-transform duration-300">
                <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center m-auto mb-5 shadow-sm border border-gray-100">
                    <ShieldCheck className='w-8 h-8 text-primary' />
                </div>
                <p className='font-black text-gray-800 uppercase tracking-tighter'>Certified Quality</p>
                <p className='text-gray-500 text-xs font-medium'>100% Genuine and WHO-approved medicines.</p>
            </div>
            <div className="hover:scale-105 transition-transform duration-300">
                <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center m-auto mb-5 shadow-sm border border-gray-100">
                    <HeadphonesIcon className='w-8 h-8 text-primary' />
                </div>
                <p className='font-black text-gray-800 uppercase tracking-tighter'>24/7 Support</p>
                <p className='text-gray-500 text-xs font-medium'>Expert pharmacists ready to assist you.</p>
            </div>
        </div>
    )
}

export default OurPolicy
