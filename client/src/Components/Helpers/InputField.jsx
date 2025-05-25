
function InputField({ id, onChange, type, value, placeholder, defaultValue }) {

    const handleChange = (e) => {
        [e.target.id] = value
    }

  return (
    <div className="relative group">
        <input
            id={id}
            type= { type ? type : 'text' }
            placeholder={placeholder}
            className="w-full py-[12px] bg-white border-b-2 border-black focus:outline-none focus:ring-0 transition-all duration-300"
            onChange={onChange}
            defaultValue={defaultValue}
        />
        <span className="absolute left-0 bottom-0 h-[2px] w-0 bg-gradient-to-r from-red-500 to-green-500 transition-all duration-300 group-focus-within:w-full"></span>
    </div>
  )
}

export default InputField
