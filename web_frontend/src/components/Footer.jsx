import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div className='md:mx-10 border-t border-gray-100 mt-20 pt-16'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 text-sm' >
        {/* ====left==== */}
        <div className="animate-fadeIn">
          <img className='mb-6 w-32' src={assets.logo} alt="Biswash Pharmacy Logo" />
          <p className='w-full md:w-3/4 text-gray-500 leading-7 font-medium'>
            Biswash Pharmacy is your trusted healthcare partner, providing quality medications and wellness products since 2010. We are committed to your health with 24/7 expert care and express home delivery.
          </p>
        </div>
        {/* ====center==== */}
        <div className="animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <p className='text-lg font-black text-gray-800 mb-6 uppercase tracking-wider'>Company</p>
          <ul className='flex flex-col gap-3 text-gray-500 font-medium'>
            <li className="hover:text-primary cursor-pointer transition-colors">Home</li>
            <li className="hover:text-primary cursor-pointer transition-colors">About us</li>
            <li className="hover:text-primary cursor-pointer transition-colors">Delivery Policy</li>
            <li className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</li>
          </ul>
        </div>
        {/* ====right==== */}
        <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <p className='text-lg font-black text-gray-800 mb-6 uppercase tracking-wider'>Get In Touch</p>
          <ul className='flex flex-col gap-3 text-gray-500 font-medium'>
            <li className="flex items-center gap-2 hover:text-primary cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +977 1-4XXXXXX
            </li>
            <li className="flex items-center gap-2 hover:text-primary cursor-pointer transition-colors lowercase">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@medinest.com
            </li>
          </ul>
        </div>

      </div>
      <div className='pt-8 pb-10'>
        <hr className="border-gray-100" />
        <p className='py-6 text-xs font-bold text-center text-gray-400 uppercase tracking-widest'>Copyright 2026 @ Biswash Pharmacy - All Rights Reserved.</p>
      </div>
    </div>
  )
}

export default Footer
