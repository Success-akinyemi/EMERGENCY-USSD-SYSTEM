import React from 'react'

function Spinner({ width, height, borderColor }) {
  return (
    <div className={`${ width ? `w-${width}` : 'w-8'} ${ height ? `h-${height}` : 'h-8' } border-4 ${ borderColor ? `border-${borderColor}` : 'border-142140' } border-t-transparent rounded-full animate-spin`}></div>
  )
}

export default Spinner
