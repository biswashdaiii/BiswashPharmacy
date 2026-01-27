import React from 'react'
import { assets } from '../assets/assets'


const Header = () => {
  return (
    <div className='flex flex-col md:flex-row flex-wrap bg-[#007E85] rounded-[2rem] px-8 md:px-16 lg:px-24 my-10 relative overflow-hidden shadow-2xl'>
      {/* Decorative blobs for "wow" factor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>

      {/* ========left side========*/}
      <div className='md:w-1/2 flex flex-col items-start justify-center gap-6 py-16 md:py-24 z-10'>
        <div className="animate-fadeIn">
          <p className='text-4xl md:text-5xl lg:text-6xl text-white font-black leading-[1.1] uppercase tracking-tighter'>
            Your Health, <br /> Our Trusted <br /> <span className="text-black/20">Commitment.</span>
          </p>
        </div>
        <div className='flex flex-col md:flex-row items-center gap-4 text-white/90 text-sm font-medium animate-fadeIn' style={{ animationDelay: '200ms' }}>
          <img className="w-24 border-2 border-white/20 rounded-full" src={assets.group_profiles} alt="" />
          <p className="max-w-xs leading-relaxed">
            Join 10k+ happy families trusting Medinest for authentic medicines and expert care.
          </p>
        </div>
        <div className="animate-fadeIn" style={{ animationDelay: '400ms' }}>
          <a href='/collection' className='inline-flex items-center gap-3 bg-white text-[#007E85] px-10 py-4 rounded-full font-black text-sm hover:bg-gray-100 hover:scale-105 hover:shadow-xl transition-all duration-500 active:scale-95 group'>
            Shop Inventory
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>

      {/*========right side=======*/}
      <div className='md:w-1/2 relative min-h-[300px] flex items-end justify-center'>
        <img className='w-4/5 md:w-full h-auto object-contain animate-float drop-shadow-2xl' src={assets.header_img} alt="Healthcare Professional" />
      </div>
    </div>
  )
}

export default Header
