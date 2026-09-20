import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import API from '../utils/api';

const AdminDashboard = () => {
    // Data States
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    
    // UI & Modal States
    const [selectedReport, setSelectedReport] = useState(null); 
    const [actionConfig, setActionConfig] = useState(null);
    const [adminMessage, setAdminMessage] = useState('');

    // Optimization: Loading & Processing States
    const [isFetching, setIsFetching] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    // Optimization: Search & Pagination States
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const reportsPerPage = 5;

    const fetchData = async () => {
        setIsFetching(true);
        try {
            const resReports = await API.get('/admin/disasters'); 
            setReports(resReports.data.data);
            const resStats = await API.get('/admin/stats'); 
            setStats(resStats.data.data);
        } catch (error) { 
            toast.error("Failed to load admin data"); 
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Filter Logic
    const filteredReports = reports.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.source.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination Logic
    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
    const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

    // Reset to page 1 if search query changes
    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    const initStatusUpdate = (id, status) => {
        if (status === 'APPROVED' || status === 'REJECTED') {
            setActionConfig({ id, status });
            setAdminMessage('');
        } else {
            handleStatusChange(id, status, '');
        }
    };

    const handleStatusChange = async (id, status, msg) => {
        setProcessingId(id); // Disable buttons for this specific report
        const toastId = toast.loading("Updating status...");
        try {
            await API.put(`/admin/disasters/${id}/status`, { status, adminMessage: msg });
            toast.success(`Report marked as ${status}`, { id: toastId }); 
            await fetchData(); // Refresh data quietly
            
            if(selectedReport && selectedReport._id === id) {
                setSelectedReport({...selectedReport, status, adminMessage: msg}); 
            }
            setActionConfig(null); 
        } catch (error) { 
            toast.error(error.response?.data?.message || "Failed to update status", { id: toastId }); 
        } finally {
            setProcessingId(null);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true); // Disable sync button
        const toastId = toast.loading("Fetching live data from USGS...");
        try {
            await API.post('/admin/sync-disasters'); 
            toast.success("Sync complete!", { id: toastId }); 
            fetchData();
        } catch (error) { 
            toast.error("Sync failed", { id: toastId }); 
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="container-fluid px-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h2 className="fw-bold mb-0">Admin Dashboard</h2>
                <button 
                    className="btn btn-outline-primary fw-bold" 
                    onClick={handleSync} 
                    disabled={isSyncing}
                >
                    {isSyncing ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Sync Automated Data (USGS)'}
                    {!isSyncing && <span className="info-icon ms-2" title="Fetch live earthquake data">ℹ</span>}
                </button>
            </div>
            
            {/* STATS CARDS */}
            <div className="row mb-4 g-3">
                <div className="col-md-3">
                    <div className="card bg-primary text-white p-4 shadow-sm border-0 h-100">
                        <h5 className="opacity-75">Total Users</h5>
                        <h1 className="display-4 fw-bold mb-0">{isFetching ? '-' : stats?.totalUsers || 0}</h1>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white p-4 shadow-sm border-0 h-100">
                        <h5 className="opacity-75">Total Reports</h5>
                        <h1 className="display-4 fw-bold mb-0">{isFetching ? '-' : stats?.totalReports || 0}</h1>
                    </div>
                </div>
            </div>

            {/* TABLE CONTROLS (SEARCH) */}
            <div className="card p-4 shadow-sm border-0 rounded-4 mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
                    <h4 className="fw-bold mb-0">Manage Emergency Reports</h4>
                    <input 
                        type="text" 
                        className="form-control w-auto" 
                        style={{ minWidth: '250px' }}
                        placeholder="Search by title, type, status..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* REPORTS TABLE */}
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr><th>Title</th><th>Type</th><th>Source</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {isFetching ? (
                                <tr><td colSpan="6" className="text-center py-4"><span className="spinner-border text-primary"></span></td></tr>
                            ) : currentReports.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-4">
                                        <em>{searchQuery ? 'No reports match your search.' : 'No emergency reports found in the system.'}</em>
                                    </td>
                                </tr>
                            ) : (
                                currentReports.map(r => (
                                    <tr key={r._id}>
                                        <td className="fw-semibold">{r.title}</td>
                                        <td><span className="badge bg-secondary">{r.type}</span></td>
                                        <td>{r.source}</td>
                                        <td><span className={`badge bg-${r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning text-dark' : r.status === 'REJECTED' ? 'danger' : 'primary'}`}>{r.status}</span></td>
                                        <td className="small text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-dark me-2 mb-1" onClick={() => setSelectedReport(r)}>View Details</button>
                                            
                                            {r.status === 'PENDING' && (
                                                <>
                                                    <button className="btn btn-sm btn-success me-2 mb-1" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'APPROVED')}>Approve</button>
                                                    <button className="btn btn-sm btn-danger mb-1" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'REJECTED')}>Reject</button>
                                                </>
                                            )}
                                            {r.status === 'APPROVED' && (
                                                <button className="btn btn-sm btn-primary mb-1" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'RESOLVED')}>Mark Resolved</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION UI */}
                {!isFetching && totalPages > 1 && (
                    <nav className="mt-3">
                        <ul className="pagination justify-content-center mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
                            </li>
                            <li className="page-item disabled"><span className="page-link">Page {currentPage} of {totalPages}</span></li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>

            {/* FULL REPORT DETAILS MODAL */}
            {selectedReport && (
                <div className="custom-modal-overlay" onClick={(e) => {if(e.target.className==='custom-modal-overlay') setSelectedReport(null)}}>
                    <div className="custom-modal-content">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <h3 className="fw-bold text-danger mb-0">{selectedReport.title}</h3>
                            <button className="btn-close" onClick={() => setSelectedReport(null)}></button>
                        </div>
                        
                        <div className="mb-3 d-flex flex-wrap gap-2">
                            <span className="badge bg-dark">Type: {selectedReport.type}</span>
                            <span className="badge bg-danger">Severity: {selectedReport.severity}</span>
                            <span className={`badge bg-${selectedReport.status === 'APPROVED' ? 'success' : 'warning text-dark'}`}>Status: {selectedReport.status}</span>
                        </div>

                        <div className="bg-light p-3 rounded mb-3 border">
                            <p className="mb-0"><strong>Description:</strong> {selectedReport.description}</p>
                        </div>
                        
                        {selectedReport.adminMessage && (
                            <div className="bg-info bg-opacity-10 p-3 rounded mb-3 border border-info">
                                <p className="mb-0"><strong>Your Admin Note:</strong> {selectedReport.adminMessage}</p>
                            </div>
                        )}

                        <div className="mb-3">
                            <strong>Location:</strong> {selectedReport.latitude.toFixed(5)}, {selectedReport.longitude.toFixed(5)}
                            <a href={`https://www.google.com/maps?q=${selectedReport.latitude},${selectedReport.longitude}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary ms-2">Open in Google Maps</a>
                        </div>
                        
                        <div className="mb-3 text-muted small">
                            <strong>Reported By:</strong> {selectedReport.reportedBy?.name || 'System (Auto)'} ({selectedReport.reportedBy?.email || selectedReport.source})<br/>
                            <strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleString()}
                        </div>

                        {selectedReport.source === 'USER' && selectedReport.imageContentType && (
                            <div className="mb-4 text-center">
                                <strong>Attached Image:</strong><br/>
                                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/disasters/${selectedReport._id}/image`} alt="Disaster Evidence" className="img-fluid rounded mt-2 border max-h-50" style={{maxHeight: '300px', objectFit: 'contain'}} onError={(e) => e.target.style.display = 'none'} />
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2 border-top pt-3">
                            <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION / MESSAGE PROMPT MODAL */}
            {actionConfig && (
                <div className="custom-modal-overlay" style={{ zIndex: 1060 }}>
                    <div className="custom-modal-content" style={{ maxWidth: '500px' }}>
                        <h4 className={`fw-bold mb-3 text-${actionConfig.status === 'APPROVED' ? 'success' : 'danger'}`}>
                            {actionConfig.status === 'APPROVED' ? 'Approve Emergency Report' : 'Reject Emergency Report'}
                        </h4>
                        
                        <div className="mb-4">
                            <label className="form-label fw-bold">Message to User (Mandatory) <span className="text-danger">*</span></label>
                            <select 
                                className="form-select mb-2 bg-light text-secondary" 
                                onChange={(e) => { if(e.target.value) setAdminMessage(e.target.value); }}
                            >
                                <option value="">-- Select a quick response --</option>
                                <option value="Help is on the way. Please stay safe.">Help is on the way.</option>
                                <option value="This request has already been assigned and taken care of.">Request already taken care of.</option>
                                <option value="Duplicate report. We are already tracking this emergency.">Duplicate report.</option>
                                <option value="Invalid report. Could not be verified.">Invalid / Unverified report.</option>
                            </select>
                            
                            <textarea 
                                className="form-control" 
                                rows="3" 
                                placeholder="Or type a custom message to the user..."
                                value={adminMessage}
                                onChange={(e) => setAdminMessage(e.target.value)}
                            ></textarea>
                        </div>
                        
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-secondary" disabled={processingId === actionConfig.id} onClick={() => setActionConfig(null)}>Cancel</button>
                            <button 
                                className={`btn btn-${actionConfig.status === 'APPROVED' ? 'success' : 'danger'} fw-bold`} 
                                disabled={processingId === actionConfig.id}
                                onClick={() => {
                                    if(!adminMessage.trim()) return toast.error('An admin message is mandatory!');
                                    handleStatusChange(actionConfig.id, actionConfig.status, adminMessage);
                                }}
                            >
                                {processingId === actionConfig.id ? <span className="spinner-border spinner-border-sm"></span> : `Confirm ${actionConfig.status === 'APPROVED' ? 'Approval' : 'Rejection'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminDashboard;
