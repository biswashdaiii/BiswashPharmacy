import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div className='md:mx-10'>
      <div className=' flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm' >
        {/* ====left==== */}
        <div>
            <img  className='mb-5 w-40' src={assets.logo} alt="" />
            <p className='w-full md:w-2/3 text-gray-600 leading-6'>hahhahahhahahahhahahhah</p>
        </div>
         {/* ====center==== */}
        <div>
            <p className='text-xl font-medium mb-5'>Company</p>
            <ul className=' flex flex-col gap-2 text-gray-600'>
                <li>Home</li>
                <li>About us</li>
                <li>Contact us</li>
                <li>privacy Policy</li>
            </ul>
        </div>
         {/* ====right==== */}
        <div>
            <p className='text-xl font-medium mb-5'>Get In Touch</p>
            <ul className=' flex flex-col gap-2 text-gray-600'>
                <li>+977 000000000</li>
                <li>sekuwa@gmail.com</li>
            </ul>
        </div>

      </div>
      <div>
        {/* =======copywritht text====== */}
        <hr />
        <p className='py-5 text-sm text-center'>copyright @2025 gharko doctor with all right reserved</p>
      </div>
    </div>
  )
}

export default Footer
