import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom'
import { menu } from '../../Data/Hospital/sidebar';

function Sidebar() {
    const data  = useSelector((state) => state.hospital);
    const hospital = data?.currentUser
    const loc = useLocation()
    const pathName = loc.pathname.split('/')[2]    

  return (
    <div className='fixed top-0 left-0 w-[20%] h-[100vh] bg-light-blue bg py-[24px] px-[18px]'>
        <div className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col items-center justify-center gap-2">
                <img src={hospital?.profileImg} alt={hospital?.name} className='h-[60px] w-[60px] rounded-full border-[2px] border-dark-blue' />
                <h1 className="text-dark-blue font-bold text-2xl">{hospital?.name}</h1>
            </div>

            <div className="max-phone:mt-3 mt-6 flex flex-col items-start h-[70vh] overflow-y-auto scrollbar w-full">
                {
                    menu.map((item, idx) => (
                        <Link key={idx} to={`/hospital${item.link}`} className={`w-full p-3 text-dark-blue font-semibold text-[18px] hover:bg-dark-blue hover:text-white hover:rounded-[6px] transition-all duration-500 ${`/${pathName}` === item.link && 'bg-dark-blue text-white rounded-[6px]'}`} >
                            {item.name}
                        </Link>
                    ))
                }
            </div>
        </div>
    </div>
  )
}

export default Sidebar
