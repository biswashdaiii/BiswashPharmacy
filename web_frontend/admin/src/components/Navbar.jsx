import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { AdminContext } from '../context/AdminContext'
import { useNavigate } from "react-router-dom"

const Navbar = () => {
  const { aToken, setAToken } = useContext(AdminContext)

  const navigate = useNavigate()
  const logout = () => {
    localStorage.clear()
    setAToken("")
    navigate('/')
  }
  return (
    <div className='flex justify-between items-center px-4 md:px-9 py-3 border-b bg-white'>
      <div className='flex items-center gap-2 text-xs'>
        <img className='w-36 sm:w-40 cursor-pointer' src={assets.logo} alt="" />
        <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600 font-medium'>Pharmacy Admin</p>
      </div>
      <button className='bg-primary text-white text-sm px-10 py-2 rounded-full' onClick={logout}>Logout</button>
    </div>

  )
}

export default Navbar
