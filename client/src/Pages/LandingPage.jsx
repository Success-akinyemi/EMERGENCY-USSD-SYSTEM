import React from 'react'
import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div className='flex flex-col items-center justify-center h-screen '>
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-[48px] font-extrabold bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
            DMS HOSPITAL QUICK EMERGENCY RESPONSE
        </h2>
        <div className="flex items-center justify-center gap-4">
            <Link to={'/hospital/register'} className="btn text-[18px] transition-transform duration-300 hover:scale-105">Register</Link>
            <Link to={'/hospital/login'} className="btn text-[18px] transition-transform duration-300 hover:scale-105">Login</Link>
        </div>

      </div>
    </div>
  )
}

export default LandingPage
