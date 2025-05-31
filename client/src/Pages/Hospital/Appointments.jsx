import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../Components/Hospital/Sidebar";
import { useFetchAppointments } from "../../Helpers/apis/hospital/fetch";
import Spinner from "../../Components/Helpers/Spinner";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { markAppointmentNotificationAsRead, rejectAppointRequest } from "../../Helpers/apis/hospital/apis";
import { Link } from "react-router-dom";
import { MdMoreTime } from "react-icons/md";

function Appointments({ setSelectedCard, setAppointmentId }) {
    const hospitalData = useSelector((state) => state.hospital);
    const hospital = hospitalData?.currentUser;

    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [readFilter, setReadFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState();
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [dateFilter, setDateFilter] = useState('allTime');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [showDateCalender, setShowDateCalender] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [appliedStartDate, setAppliedStartDate] = useState('');
    const [appliedEndDate, setAppliedEndDate] = useState('');
    const [marking, setMarking] = useState(false);
    const [rejectingRequest, setRejectingRequest] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');

    const handleStatusFilter = (data) => {
        setStatusFilter(data || undefined);
        setShowStatusMenu(false);
    };

    const toggleDateFilter = () => {
        setShowDateFilter(!showDateFilter);
        if (showDateCalender) {
            setShowDateCalender(false);
        }
    };

    const handleDateFilter = (data) => {
        setDateFilter(data);
        setShowDateFilter(false);
        if (data === 'custom') {
            setShowDateCalender(true);
        }
    };

    const handleCustomDate = () => {
        if (!startDate) {
            toast.error('Start date is required');
            return;
        }
        setAppliedStartDate(startDate);
        setAppliedEndDate(endDate);
        setShowDateCalender(false);
    };

    const handleSearch = () => {
        setAppliedSearchTerm(searchTerm);
        setPage(1);
    }

    const handleSearchClear = () => {
        setAppliedSearchTerm();
        setSearchTerm('')
    }

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", page);

        if (readFilter !== "all") params.append("read", readFilter);
        if (statusFilter) params.append("status", statusFilter);

        if (dateFilter === "custom") {
            params.append("period", "custom");
            if (appliedStartDate) params.append("startDate", appliedStartDate);
            if (appliedEndDate) params.append("endDate", appliedEndDate);
        }
        else if (dateFilter !== "allTime") {
            params.append("period", dateFilter);
        }

        //serach term
        if (appliedSearchTerm) {
            params.append("search", appliedSearchTerm);
        }

        return params.toString();
    }, [page, readFilter, statusFilter, dateFilter, appliedStartDate, appliedEndDate, appliedSearchTerm]);

    const { data, isFetching } = useFetchAppointments(`?${queryString}`);
    const totalPages = data?.data?.totalPages || 1;

    useEffect(() => {
        if (data?.data?.data) {
            setNotifications(data.data.data);
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

        const pages = [
            <button key="prev" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                {"<"}
            </button>
        ];

        pages.push(...[1, 2, 3].map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 mx-1 border ${page === p ? "bg-dark-blue text-white" : ""}`}>
                {p}
            </button>
        )));

        if (page > 5) pages.push(<span key="dots1">...</span>);

        if (page > 3 && page < totalPages - 2) {
            pages.push(
                <button key="current" className="px-2 py-1 mx-1 border bg-dark-blue text-white" disabled>
                    {page}
                </button>
            );
        }

        if (page < totalPages - 4) pages.push(<span key="dots2">...</span>);

        pages.push(...[totalPages - 2, totalPages - 1, totalPages].map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 mx-1 border ${page === p ? "bg-dark-blue text-white" : ""}`}>
                {p}
            </button>
        )));

        pages.push(
            <button key="next" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                {">"}
            </button>
        );

        return pages;
    };

    const handleMarkAsRead = async (notificationId) => {
        if (!hospital?.hospitalId) return toast.error('Hospital information missing');
        if (!notificationId) return toast.error('Notification ID required');
        if (marking) return;

        try {
            setMarking(true);
            const res = await markAppointmentNotificationAsRead({
                hospitalId: hospital.hospitalId,
                notificationId
            });
            if (res.success) {
                toast.success(res.message);
                window.location.reload();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error(`Error marking notification as read`);
        } finally {
            setMarking(false);
        }
    };

    const handleAcceptRequest = (notificationId) => {
        if (!notificationId) return toast.error('Notification ID required');
        setAppointmentId(notificationId);
        setSelectedCard('acceptAppointment');
    };

    const handleRejectRequest = async (notificationId) => {
        if (!notificationId) return toast.error('Notification ID required');
        if (rejectingRequest) return;

        try {
            setRejectingRequest(true);
            const res = await rejectAppointRequest({ notificationId });
            if (res.success) {
                toast.success(res.message);
                window.location.reload();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error(`Error rejecting appointment`);
        } finally {
            setRejectingRequest(false);
        }
    };

    const handleAdjustTime = () => {
        setSelectedCard('adjustTime')
    }

    return (
        <div className="flex w-full min-h-screen">
            <div className="w-[20%]">
                <Sidebar />
            </div>

            <div className="w-[80%]">
                {isFetching ? (
                    <div className="flex items-center justify-center h-screen">
                        <Spinner borderColor={"#142140"} />
                    </div>
                ) : (
                    <div className="page">
                        <h1 className="title">Appointments Ussd Notifications</h1>

                        <div className="flex justify-end my-4 gap-4 w-full">
                            <div className="flex mr-auto">
                                <input 
                                    type="text" 
                                    placeholder="Search by request Id" 
                                    className="input p-0" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                    }}
                                />
                                <div className="flex items-center gap-1.5">
                                    <div className="btn2" onClick={handleSearch}>Search</div>
                                    {
                                        searchTerm && (
                                            <div className="btn2" onClick={() => handleSearchClear()} >Clear</div>
                                        )
                                    }
                                </div>
                            </div>

                            {/**RIGHT SIDE */}
                            <div className="flex gap-4">
                                <button
                                    className={`py-2 px-2 rounded-[4px] cursor-pointer ${readFilter === 'all' ? 'bg-dark-blue text-white' : 'bg-white border-[1px] text-dark-blue'}`}
                                    onClick={() => setReadFilter("all")}
                                >
                                    All
                                </button>
                                <button
                                    className={`py-2 px-2 rounded-[4px] cursor-pointer ${readFilter === 'true' ? 'bg-dark-blue text-white' : 'bg-white border-[1px] text-dark-blue'}`}
                                    onClick={() => setReadFilter("true")}
                                >
                                    Read
                                </button>
                                <button
                                    className={`py-2 px-2 rounded-[4px] cursor-pointer ${readFilter === 'false' ? 'bg-dark-blue text-white' : 'bg-white border-[1px] text-dark-blue'}`}
                                    onClick={() => setReadFilter("false")}
                                >
                                    Unread
                                </button>
                            </div>

                            <div className="relative">
                                <div
                                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                                    className="bg-dark-blue text-white px-1 py-1.5 rounded-[4px] min-w-[100px] text-center"
                                >
                                    {statusFilter || 'Status'}
                                </div>
                                {showStatusMenu && (
                                    <div className="flex flex-col bg-white border-[2px] border-dark-blue py-3 px-1 rounded-[4px] absolute mt-1 z-10">
                                        <div
                                            onClick={() => handleStatusFilter(``)}
                                            className={`text-dark-blue text-[15px] font-semibold cursor-pointer py-1 px-1.5 rounded-[4px] hover:text-white hover:bg-dark-blue transition-all duration-100 ${!statusFilter && 'bg-dark-blue text-white'}`}
                                        >
                                            All
                                        </div>
                                        <div
                                            onClick={() => handleStatusFilter(`Pending`)}
                                            className={`text-dark-blue text-[15px] font-semibold cursor-pointer py-1 px-1.5 rounded-[4px] hover:text-white hover:bg-dark-blue transition-all duration-100 ${statusFilter === 'Pending' && 'bg-dark-blue text-white'}`}
                                        >
                                            Pending
                                        </div>
                                        <div
                                            onClick={() => handleStatusFilter(`Accepted`)}
                                            className={`text-dark-blue text-[15px] font-semibold cursor-pointer py-1 px-1.5 rounded-[4px] hover:text-white hover:bg-dark-blue transition-all duration-100 ${statusFilter === 'Accepted' && 'bg-dark-blue text-white'}`}
                                        >
                                            Accepted
                                        </div>
                                        <div
                                            onClick={() => handleStatusFilter(`Rejected`)}
                                            className={`text-dark-blue text-[15px] font-semibold cursor-pointer py-1 px-1.5 rounded-[4px] hover:text-white hover:bg-dark-blue transition-all duration-100 ${statusFilter === 'Rejected' && 'bg-dark-blue text-white'}`}
                                        >
                                            Rejected
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <div
                                    onClick={toggleDateFilter}
                                    className="bg-dark-blue text-white px-1 py-1.5 rounded-[4px] min-w-[100px] text-center"
                                >
                                    {dateFilter === 'custom' && appliedStartDate ? 'Custom' : dateFilter}
                                </div>
                                {showDateFilter && (
                                    <div className="flex flex-col bg-white border-[2px] border-dark-blue py-3 px-1 rounded-[4px] absolute mt-1 z-10">
                                        {['today', '3days', '7days', '15days', '30days', 'allTime', 'custom'].map((filter) => (
                                            <div
                                                key={filter}
                                                onClick={() => handleDateFilter(filter)}
                                                className={`text-dark-blue text-[15px] font-semibold cursor-pointer py-1 px-1.5 rounded-[4px] hover:text-white hover:bg-dark-blue ${dateFilter === filter && 'bg-dark-blue text-white'}`}
                                            >
                                                {filter === 'allTime' ? 'All Time' : filter}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                                {showDateCalender && (
                                    <div className="flex flex-col bg-white border-[2px] border-dark-blue py-2 px-2 rounded-[4px] absolute mt-10 z-20 w-[250px] ml-auto">
                                        <label className="text-xs text-gray-600">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            max={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="border p-1 mb-2 rounded"
                                        />

                                        <label className="text-xs text-gray-600">End Date</label>
                                        <input
                                            type="date"
                                            max={new Date().toISOString().split('T')[0]}
                                            min={startDate}
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="border p-1 rounded"
                                        />

                                        <button
                                            onClick={handleCustomDate}
                                            className="btn2 mt-4 text-center"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                            <div
                                onClick={handleAdjustTime}
                                className="bg-dark-blue text-white px-2 py-1.5 rounded-[4px] min-w-[100px] text-center flex items-center justify-center"
                            >
                                <MdMoreTime className='text-white text-[18px]' />
                                Adjust Appointment
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full table-auto border-collapse border border-dark-blue mt-4">
                                <thead>
                                    <tr className="bg-dark-blue text-white">
                                        <th className="p-2 border border-dark-blue text-left">Request ID</th>
                                        <th className="p-2 border border-dark-blue text-left">Message</th>
                                        <th className="p-2 border border-dark-blue text-left">Read Status</th>
                                        <th className="p-2 border border-dark-blue text-left">Status</th>
                                        <th className="p-2 border border-dark-blue text-left">Date</th>
                                        <th className="p-2 border border-dark-blue text-left">Actions</th>
                                        <th className="p-2 border border-dark-blue text-left">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifications?.map((item) => (
                                        <tr key={item.notificationId} className="border-t border-dark-blue">
                                            <td className="p-2 border border-dark-blue">{item?.ussdRequestId}</td>
                                            <td className="p-2 border border-dark-blue">{item?.ussdRequest?.message || "-"}</td>
                                            <td className="p-2 border border-dark-blue">
                                                {item?.read ? "Read" : (
                                                    <span
                                                        onClick={() => handleMarkAsRead(item.notificationId)}
                                                        className="cursor-pointer hover:underline"
                                                    >
                                                        Mark as Read
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-2 border border-dark-blue">{item?.ussdRequest?.status || "-"}</td>
                                            <td className="p-2 border border-dark-blue">
                                                {
                                                    item?.ussdRequest?.date && (
                                                        new Date(item?.ussdRequest?.date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })

                                                    )
                                                } -- {' '}
                                                {
                                                    item?.ussdRequest?.time && (
                                                        item?.ussdRequest?.time
                                                    )
                                                }
                                            </td>
                                            <td className="p-2 border border-dark-blue">
                                                {item?.ussdRequest?.status.toLowerCase() === 'accepted' ? (
                                                    <span className="btn2 py-1 px-1 bg-green-500 cursor-not-allowed">
                                                        Accepted
                                                    </span>
                                                ) : item?.ussdRequest?.status.toLowerCase() === 'rejected' ? (
                                                    <span
                                                        onClick={() => handleAcceptRequest(item)}
                                                        className="btn2 py-1 px-1 bg-green-500 cursor-pointer"
                                                    >
                                                        Accept
                                                    </span>
                                                ) : (
                                                    <span className="flex gap-2">
                                                        <span
                                                            onClick={() => handleAcceptRequest(item)}
                                                            className="btn2 py-1 px-1 bg-green-500 cursor-pointer"
                                                        >
                                                            Accept
                                                        </span>
                                                        <span
                                                            onClick={() => handleRejectRequest(item.notificationId)}
                                                            className="btn2 py-1 px-1 bg-red-500 cursor-pointer"
                                                        >
                                                            Reject
                                                        </span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-2 border border-dark-blue">
                                                <Link
                                                    to={`/hospital/appointment/${item?.notificationId}`}
                                                    className="text-[14px] font-semibold hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-center mt-6 space-x-2">
                            {renderPagination()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Appointments;