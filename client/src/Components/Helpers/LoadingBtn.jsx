import React from 'react'

function LoadingBtn({ bgStyle, spinnerStyle }) {
  return (
    <div className={`btn ${bgStyle ? bgStyle : ''}`}>
        <div className={`w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin ${spinnerStyle}`}></div>
    </div>
  )
}

export default LoadingBtn
