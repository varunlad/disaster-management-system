import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import toast from 'react-hot-toast';
import API from '../utils/api';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('REPORTS'); // 'REPORTS' | 'USGS'
    
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null); 
    const [actionConfig, setActionConfig] = useState(null);
    const [adminMessage, setAdminMessage] = useState('');

    const [isFetching, setIsFetching] = useState(true);
    const [processingId, setProcessingId] = useState(null);

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

    // 1. FILTER BY ACTIVE TAB FIRST (This drives the graphs AND the table)
    const baseFilteredReports = reports.filter(r => 
        activeTab === 'REPORTS' ? r.source === 'USER' : r.source === 'USGS'
    );

    // 2. DYNAMIC GRAPH CALCULATIONS (Based strictly on the active tab's data)
    const statusCounts = {
        PENDING: baseFilteredReports.filter(r => r.status === 'PENDING').length,
        APPROVED: baseFilteredReports.filter(r => r.status === 'APPROVED').length,
        RESOLVED: baseFilteredReports.filter(r => r.status === 'RESOLVED').length,
        REJECTED: baseFilteredReports.filter(r => r.status === 'REJECTED').length
    };

    const severityCounts = {
        LOW: baseFilteredReports.filter(r => r.severity === 'LOW').length,
        MEDIUM: baseFilteredReports.filter(r => r.severity === 'MEDIUM').length,
        HIGH: baseFilteredReports.filter(r => r.severity === 'HIGH').length,
        CRITICAL: baseFilteredReports.filter(r => r.severity === 'CRITICAL').length
    };

    const statusChartOptions = {
        labels: ['Pending', 'Approved', 'Resolved', 'Rejected'],
        colors: ['#ffc107', '#198754', '#0d6efd', '#dc3545'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true }
    };
    const statusChartSeries = [statusCounts.PENDING, statusCounts.APPROVED, statusCounts.RESOLVED, statusCounts.REJECTED];

    const severityChartOptions = {
        chart: { toolbar: { show: false } },
        xaxis: { categories: ['Low', 'Medium', 'High', 'Critical'] },
        colors: ['#20c997', '#fd7e14', '#e63946', '#7209b7'],
        plotOptions: { bar: { borderRadius: 6, distributed: true } },
        legend: { show: false }
    };
    const severityChartSeries = [{ 
        name: activeTab === 'REPORTS' ? 'User Reports' : 'USGS Events', 
        data: [severityCounts.LOW, severityCounts.MEDIUM, severityCounts.HIGH, severityCounts.CRITICAL] 
    }];

    // 3. APPLY SEARCH QUERY FOR TABLE PAGINATION
    const finalTableData = baseFilteredReports.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = finalTableData.slice(indexOfFirstReport, indexOfLastReport);
    const totalPages = Math.ceil(finalTableData.length / reportsPerPage);

    // Reset pagination when search or tab changes
    useEffect(() => { setCurrentPage(1); }, [searchQuery, activeTab]);

    const initStatusUpdate = (id, status) => {
        if (status === 'APPROVED' || status === 'REJECTED') {
            setActionConfig({ id, status }); 
            setAdminMessage('');
        } else { 
            handleStatusChange(id, status, ''); 
        }
    };

    const handleStatusChange = async (id, status, msg) => {
        setProcessingId(id); 
        const toastId = toast.loading("Updating status...");
        try {
            await API.put(`/admin/disasters/${id}/status`, { status, adminMessage: msg });
            toast.success(`Report marked as ${status}`, { id: toastId }); 
            await fetchData(); 
            if (selectedReport && selectedReport._id === id) { 
                setSelectedReport({ ...selectedReport, status, adminMessage: msg }); 
            }
            setActionConfig(null); 
        } catch (error) { 
            toast.error(error.response?.data?.message || "Failed to update status", { id: toastId }); 
        } finally { 
            setProcessingId(null); 
        }
    };

    const activeLabel = activeTab === 'REPORTS' ? 'User Reports' : 'USGS Events';

    return (
        <div className="container-fluid px-4">
            
            <h2 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0f2027, #2c5364)',
                    color: 'white', boxShadow: '0 2px 8px rgba(0,0,0, 0.3)'
                }}>
                    ⚙️
                </span>
                Admin Operations Center
            </h2>

            {/* FIXED GRAPHS (Data shifts dynamically based on active tab) */}
            <div className="row mb-4 g-4">
                <div className="col-lg-6">
                    <div className="card card-custom h-100 p-4 border-0 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0">Status: {activeLabel}</h5>
                            <span className="badge bg-secondary">Total: {baseFilteredReports.length}</span>
                        </div>
                        {baseFilteredReports.length > 0 ? (
                            <Chart options={statusChartOptions} series={statusChartSeries} type="donut" height={260} />
                        ) : (
                            <div className="text-center py-5 text-muted">No data available for this section.</div>
                        )}
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card card-custom h-100 p-4 border-0 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0">Severity: {activeLabel}</h5>
                        </div>
                        {baseFilteredReports.length > 0 ? (
                            <Chart options={severityChartOptions} series={severityChartSeries} type="bar" height={260} />
                        ) : (
                            <div className="text-center py-5 text-muted">No severity data available yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link text-dark ${activeTab === 'REPORTS' ? 'active fw-bold' : ''}`} onClick={() => { setActiveTab('REPORTS'); setSearchQuery(''); }}>
                        📝 Manage User Reports
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link text-dark ${activeTab === 'USGS' ? 'active fw-bold' : ''}`} onClick={() => { setActiveTab('USGS'); setSearchQuery(''); }}>
                        🌍 Global USGS Earthquakes
                    </button>
                </li>
            </ul>

            {/* TAB 1: USER REPORTS */}
            {activeTab === 'REPORTS' && (
                <div className="card p-4 shadow-sm border-0 rounded-4 mb-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                        <h4 className="fw-bold mb-0">Manage User Reports</h4>
                        <input type="text" className="form-control w-auto" style={{ minWidth: '250px' }} placeholder="Search user reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr><th>Title</th><th>Type</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {isFetching ? (
                                    <tr><td colSpan="5" className="text-center py-4"><span className="spinner-border text-primary"></span></td></tr>
                                ) : currentReports.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center text-muted py-4"><em>No user reports found.</em></td></tr>
                                ) : (
                                    currentReports.map(r => (
                                        <tr key={r._id}>
                                            <td className="fw-semibold">{r.title}</td>
                                            <td><span className="badge bg-secondary">{r.type}</span></td>
                                            <td><span className={`badge bg-${r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning text-dark' : r.status === 'REJECTED' ? 'danger' : 'primary'}`}>{r.status}</span></td>
                                            <td className="small text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-dark me-2 mb-1" onClick={() => setSelectedReport(r)}>View</button>
                                                
                                                {r.status === 'PENDING' && (
                                                    <>
                                                        <button className="btn btn-sm btn-success me-2 mb-1" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'APPROVED')}>Approve</button>
                                                        <button className="btn btn-sm btn-danger mb-1" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'REJECTED')}>Reject</button>
                                                    </>
                                                )}
                                                {r.status === 'APPROVED' && (
                                                    <button className="btn btn-sm btn-primary mb-1" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'RESOLVED')}>Resolve</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {!isFetching && totalPages > 1 && (
                        <nav className="mt-3">
                            <ul className="pagination justify-content-center mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button></li>
                                <li className="page-item disabled"><span className="page-link">Page {currentPage} of {totalPages}</span></li>
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setCurrentPage(prev => prev + 1)}>Next</button></li>
                            </ul>
                        </nav>
                    )}
                </div>
            )}

            {/* TAB 2: USGS EARTHQUAKES */}
            {activeTab === 'USGS' && (
                <>
                    <div className="card card-custom p-4 shadow-sm border-0 mb-4" style={{ borderLeft: '6px solid #0dcaf0' }}>
                        <h5 className="fw-bold text-info-emphasis mb-2">🌍 About Global USGS Earthquake Data</h5>
                        <p className="text-muted mb-2">The <strong>United States Geological Survey (USGS)</strong> provides automated real-time seismic monitoring data collected from global sensor networks.</p>
                        <ul className="text-muted small mb-0 ps-3">
                            <li><strong>Inclusion Criteria:</strong> Captures global seismic events with a <strong>Magnitude greater than 4.5</strong>.</li>
                            <li><strong>Severity Mapping:</strong> Automatically categorized into Low, Medium, High, or Critical based on Richter scale readings.</li>
                            <li><strong>Action Limits:</strong> As these are naturally occurring events tracked via satellite, manual resolution actions are disabled.</li>
                        </ul>
                    </div>

                    <div className="card p-4 shadow-sm border-0 rounded-4 mb-4" style={{ borderTop: '5px solid #0dcaf0' }}>
                        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                            <h4 className="fw-bold mb-0">Automated Earthquake Log</h4>
                            <input type="text" className="form-control w-auto" style={{ minWidth: '250px' }} placeholder="Search earthquakes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr><th>Event Title</th><th>Type</th><th>Status</th><th>Date Logged</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {isFetching ? (
                                        <tr><td colSpan="5" className="text-center py-4"><span className="spinner-border text-primary"></span></td></tr>
                                    ) : currentReports.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center text-muted py-4"><em>No automated earthquake data available yet.</em></td></tr>
                                    ) : (
                                        currentReports.map(r => (
                                            <tr key={r._id}>
                                                <td className="fw-semibold">{r.title}</td>
                                                <td><span className="badge bg-secondary">{r.type}</span></td>
                                                <td><span className={`badge bg-${r.status === 'APPROVED' ? 'success' : 'primary'}`}>{r.status}</span></td>
                                                <td className="small text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-dark" onClick={() => setSelectedReport(r)}>View Satellite Data</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {!isFetching && totalPages > 1 && (
                            <nav className="mt-3">
                                <ul className="pagination justify-content-center mb-0">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button></li>
                                    <li className="page-item disabled"><span className="page-link">Page {currentPage} of {totalPages}</span></li>
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setCurrentPage(prev => prev + 1)}>Next</button></li>
                                </ul>
                            </nav>
                        )}
                    </div>
                </>
            )}

            {/* FULL DETAILS MODAL */}
            {selectedReport && (
                <div className="custom-modal-overlay" onClick={(e) => { if (e.target.className === 'custom-modal-overlay') setSelectedReport(null); }}>
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
                            <strong>Location Coordinates:</strong> {selectedReport.latitude ? selectedReport.latitude.toFixed(5) : 'N/A'}, {selectedReport.longitude ? selectedReport.longitude.toFixed(5) : 'N/A'}
                            <a href={`https://www.google.com/maps?q=${selectedReport.latitude},${selectedReport.longitude}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary ms-2">Open in Maps</a>
                            {selectedReport.landmark && <div className="mt-2 text-primary"><strong>Nearest Landmark:</strong> {selectedReport.landmark}</div>}
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

            {/* ACTION / MESSAGE MODAL */}
            {actionConfig && (
                <div className="custom-modal-overlay" style={{ zIndex: 1060 }}>
                    <div className="custom-modal-content" style={{ maxWidth: '500px' }}>
                        <h4 className={`fw-bold mb-3 text-${actionConfig.status === 'APPROVED' ? 'success' : 'danger'}`}>
                            {actionConfig.status === 'APPROVED' ? 'Approve Emergency Report' : 'Reject Emergency Report'}
                        </h4>
                        <div className="mb-4">
                            <label className="form-label fw-bold">Message to User (Mandatory) <span className="text-danger">*</span></label>
                            <select className="form-select mb-2 bg-light text-secondary" onChange={(e) => { if (e.target.value) setAdminMessage(e.target.value); }}>
                                <option value="">-- Select a quick response --</option>
                                <option value="Help is on the way. Please stay safe.">Help is on the way.</option>
                                <option value="This request has already been assigned and taken care of.">Request already taken care of.</option>
                                <option value="Duplicate report. We are already tracking this emergency.">Duplicate report.</option>
                                <option value="Invalid report. Could not be verified.">Invalid / Unverified report.</option>
                            </select>
                            <textarea className="form-control" rows="3" placeholder="Or type a custom message to the user..." value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)}></textarea>
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-secondary" disabled={processingId === actionConfig.id} onClick={() => setActionConfig(null)}>Cancel</button>
                            <button className={`btn btn-${actionConfig.status === 'APPROVED' ? 'success' : 'danger'} fw-bold`} disabled={processingId === actionConfig.id}
                                onClick={() => {
                                    if (!adminMessage.trim()) return toast.error('An admin message is mandatory!');
                                    handleStatusChange(actionConfig.id, actionConfig.status, adminMessage);
                                }}>
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
