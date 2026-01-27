import React from 'react'

const Title = ({ text1, text2 }) => {
    return (
        <div className='inline-flex gap-3 items-center mb-5'>
            <p className='text-gray-500 font-medium text-2xl lg:text-3xl'>{text1} <span className='text-gray-900 font-black'>{text2}</span></p>
            <div className='flex flex-col gap-[4px]'>
                <p className='w-8 sm:w-12 h-[2px] sm:h-[3px] bg-[#007E85] rounded-full'></p>
                <p className='w-5 sm:w-8 h-[2px] sm:h-[3px] bg-[#007E85] rounded-full opacity-50'></p>
            </div>
        </div>
    )
}

export default Title
