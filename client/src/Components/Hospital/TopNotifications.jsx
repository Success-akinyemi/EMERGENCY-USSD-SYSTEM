import { useEffect, useState } from "react";
import { useFetchNotification } from "../../Helpers/apis/hospital/fetch";
import Spinner from "../Helpers/Spinner";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { acceptRequest, markNotificationAsRead, rejectRequest } from "../../Helpers/apis/hospital/apis";

function TopNotifications() {
    const hospitalData  = useSelector((state) => state.hospital);
    const hospital = hospitalData?.currentUser

  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  queryParams.append("page", 1);
  queryParams.append("limit", 10);
  queryParams.append("status", 'pending');
  queryParams.append("read", 'false')


  const { data, isFetching } = useFetchNotification(`?${queryParams.toString()}`);

  const totalPages = data?.data?.totalPages || 1;

  useEffect(() => {
    if (data?.data?.data) {
      setNotifications(data.data.data);
      //console.log('notifications', data.data.data)
    }
  }, [data]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setPage(newPage);
  };

  const renderPagination = () => {
    if (totalPages <= 6) {
      return [...Array(totalPages)].map((_, idx) => (
        <button
          key={idx}
          onClick={() => setPage(idx + 1)}
          className={`px-2 py-1 border mx-1 ${page === idx + 1 ? "bg-dark-blue text-white" : ""}`}
        >
          {idx + 1}
        </button>
      ));
    }

    const pages = [];

    pages.push(
      <button key="prev" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
        {"<"}
      </button>
    );

    pages.push(
      ...[1, 2, 3].map((p) => (
        <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 mx-1 border ${page === p ? "bg-dark-blue text-white" : ""}`}>
          {p}
        </button>
      ))
    );

    if (page > 5) pages.push(<span key="dots1">...</span>);

    if (page > 3 && page < totalPages - 2) {
      pages.push(
        <button key="current" className="px-2 py-1 mx-1 border bg-dark-blue text-white" disabled>
          {page}
        </button>
      );
    }

    if (page < totalPages - 4) pages.push(<span key="dots2">...</span>);

    pages.push(
      ...[totalPages - 2, totalPages - 1, totalPages].map((p) => (
        <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 mx-1 border ${page === p ? "bg-dark-blue text-white" : ""}`}>
          {p}
        </button>
      ))
    );

    pages.push(
      <button key="next" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
        {">"}
      </button>
    );

    return pages;
  };

  //apis
  const [ marking, setMarking ] = useState(false)
  const handleMarkAsRead = async (hospitalId, notificationId) => {
    if(!hospitalId) return toast.error('Hospital Id is required')
    if(!notificationId) return toast.error('Notification Id is required')
    if(marking) return
    const formData = { hospitalId, notificationId }
    try {
        setMarking(true)
        //console.log('formData', formData)
        const res = await markNotificationAsRead(formData)
        if(res.success){
            toast.success(res.message)
            window.location.reload()
        }else {
            toast.error(res.message)
        }
    } catch (error) {
        toast.error(`Unable to mark Emergency ${notificationId} as read`)
    } finally {
        setMarking(false)
    }
  }

  //accept ussd req
  const [ acceptingRequest, setAcceptingRequest ] = useState(false)
  const handleAcceptRequest = async (hospitalId, notificationId) => {
    if(!notificationId) return toast.error('Notification Id is required')
    if(acceptingRequest) return
    const formData = { notificationId }

    try {
        setAcceptingRequest(true)
        //console.log('formData', formData)
        const res = await acceptRequest(formData)
        if(res.success){
            toast.success(res.message)
            window.location.reload()
        }else {
            toast.error(res.message)
        }
    } catch (error) {
        console.log('error', error)
        toast.error(`Unable to accept Emergency ${notificationId}`)
    } finally {
        setAcceptingRequest(false)
    }
  }

  //reject ussd req
  const [ rejectingRequest, setRejectingRequest ] = useState(false)
  const handleRejectRequest = async (hospitalId, notificationId) => {
    if(!notificationId) return toast.error('Notification Id is required')
    if(rejectingRequest) return
    const formData = { notificationId }

    try {
        setRejectingRequest(true)
        //console.log('formData', formData)
        const res = await rejectRequest(formData)
        if(res.success){
            toast.success(res.message)
            window.location.reload()
        }else {
            toast.error(res.message)
        }
    } catch (error) {
        toast.error(`Unable to reject Notification ${notificationId}`)
    } finally {
        setRejectingRequest(false)
    }
  }


  return (
      <div className="flex w-full min-h-screen">

          <div className="w-full">
              {isFetching ? (
                  <div className="flex items-center justify-center h-screen">
                      <Spinner borderColor={"#142140"} />
                  </div>
              ) : (
                  <div className="max-small-phone:px-2 max-phone:px-2 px-4">
                      <h1 className="title text-[18px]">Recent Emergencies</h1>

                      {/* Notification Table */}
                      <div className="overflow-x-auto">
                          <table className="w-full table-auto border-collapse border border-dark-blue mt-4">
                              <thead>
                                  <tr className="bg-dark-blue text-white">
                                      <th className="p-2 border border-dark-blue text-left">Notification ID</th>
                                      <th className="p-2 border border-dark-blue text-left">Request ID</th>
                                      <th className="p-2 border border-dark-blue text-left">Message</th>
                                      <th className="p-2 border border-dark-blue text-left">Read Status</th>
                                      <th className="p-2 border border-dark-blue text-left">Status</th>
                                      <th className="p-2 border border-dark-blue text-left"></th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {notifications?.map((item, i) => (
                                      <tr key={i} className="border-t border-dark-blue">
                                          <td className="p-2 border border-dark-blue">{item?.notificationId}</td>
                                          <td className="p-2 border border-dark-blue">{item?.ussdRequestId}</td>
                                          <td className="p-2 border border-dark-blue">{item?.ussdRequest?.message || "-"}</td>
                                          <td className="p-2 border border-dark-blue">{item?.read ? "Read" : <span onClick={() => handleMarkAsRead(hospital.hospitalId, item.notificationId)} className="cursor-pointer">Mark as Read</span>}</td>
                                          <td className="p-2 border border-dark-blue">{item?.ussdRequest?.status || "-"}</td>
                                          <td className="p-2 border border-dark-blue">
                                            {
                                                    item?.status.toLowerCase() === 'accepted' 
                                                    ? 
                                                    <span className="btn2 py-1 px-1 bg-green-500 cursor-not-allowed">Accepted</span> 
                                                    :
                                                    item?.status.toLowerCase() === 'rejected'
                                                    ?
                                                    <span onClick={() => handleAcceptRequest(hospital.hospitalId, item.notificationId)} className="btn2 py-1 px-1 bg-green-500">Accept</span>
                                                    :
                                                    <span className=""> <span onClick={() => handleAcceptRequest(hospital.hospitalId, item.notificationId)} className="btn2 py-1 px-1 bg-green-500">Accept</span>  <span onClick={() => handleRejectRequest(hospital.hospitalId, item.notificationId)} className="btn2 py-1 px-1 bg-red-500">Reject</span> </span>
                                            }
                                            </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>

                      {/* Pagination UI */}
                      <div className="flex justify-center mt-6 space-x-2">{renderPagination()}</div>
                  </div>
              )}
          </div>
      </div>
  );
}

export default TopNotifications;
