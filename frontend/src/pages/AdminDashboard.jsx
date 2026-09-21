import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import toast from 'react-hot-toast';
import API from '../utils/api';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('REPORTS'); 
    
    const [activeData, setActiveData] = useState([]);
    const [stats, setStats] = useState(null);
    
    const [selectedReport, setSelectedReport] = useState(null); 
    const [actionConfig, setActionConfig] = useState(null);
    const [adminMessage, setAdminMessage] = useState('');

    const [isFetching, setIsFetching] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const reportsPerPage = 5;

    useEffect(() => {
        API.get('/admin/stats').then(res => setStats(res.data.data)).catch(() => {});
    }, []);

    const fetchDataForTab = async (tab) => {
        setIsFetching(true);
        try {
            let endpoint = '/admin/disasters/user';
            if (tab === 'USGS') endpoint = '/admin/disasters/usgs';
            else if (tab === 'NASA') endpoint = '/admin/disasters/nasa';

            const { data } = await API.get(endpoint);
            setActiveData(data.data);
        } catch (error) { toast.error("Failed to load data"); } 
        finally { setIsFetching(false); }
    };

    useEffect(() => { 
        fetchDataForTab(activeTab); 
        setCurrentPage(1); 
        setSearchQuery(''); 
    }, [activeTab]);

    const filteredReports = activeData.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
    const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    const initStatusUpdate = (id, status) => {
        if (status === 'APPROVED' || status === 'REJECTED') {
            setActionConfig({ id, status }); setAdminMessage('');
        } else { handleStatusChange(id, status, ''); }
    };

    const handleStatusChange = async (id, status, msg) => {
        setProcessingId(id); 
        const toastId = toast.loading("Updating status...");
        try {
            await API.put(`/admin/disasters/${id}/status`, { status, adminMessage: msg });
            toast.success(`Report marked as ${status}`, { id: toastId }); 
            await fetchDataForTab(activeTab); 
            if (selectedReport && selectedReport._id === id) { setSelectedReport({ ...selectedReport, status, adminMessage: msg }); }
            setActionConfig(null); 
        } catch (error) { toast.error(error.response?.data?.message || "Failed to update status", { id: toastId }); }
        finally { setProcessingId(null); }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        const endpoint = activeTab === 'USGS' ? '/admin/sync/usgs' : '/admin/sync/nasa';
        const sourceName = activeTab === 'USGS' ? 'Earthquakes' : 'Floods';
        
        const toastId = toast.loading(`Syncing ${sourceName}...`);
        try {
            await API.post(endpoint);
            toast.success(`${sourceName} Synced successfully!`, { id: toastId });
            await fetchDataForTab(activeTab);
        } catch (error) { toast.error(`Failed to sync ${sourceName}`, { id: toastId }); }
        finally { setIsSyncing(false); }
    };

    const getSeverityBadge = (sev) => {
        switch(sev) {
            case 'CRITICAL': return 'badge bg-danger';
            case 'HIGH': return 'badge bg-warning text-dark';
            case 'MEDIUM': return 'badge bg-primary';
            default: return 'badge bg-info text-dark';
        }
    };

    const statusCounts = {
        PENDING: activeData.filter(r => r.status === 'PENDING').length,
        APPROVED: activeData.filter(r => r.status === 'APPROVED').length,
        RESOLVED: activeData.filter(r => r.status === 'RESOLVED').length,
        REJECTED: activeData.filter(r => r.status === 'REJECTED').length
    };

    const severityCounts = {
        LOW: activeData.filter(r => r.severity === 'LOW').length,
        MEDIUM: activeData.filter(r => r.severity === 'MEDIUM').length,
        HIGH: activeData.filter(r => r.severity === 'HIGH').length,
        CRITICAL: activeData.filter(r => r.severity === 'CRITICAL').length
    };

    const statusChartOptions = { labels: ['Pending', 'Approved', 'Resolved', 'Rejected'], colors: ['#ffc107', '#198754', '#0d6efd', '#dc3545'], legend: { position: 'bottom' }, dataLabels: { enabled: true }};
    const statusChartSeries = [statusCounts.PENDING, statusCounts.APPROVED, statusCounts.RESOLVED, statusCounts.REJECTED];

    const severityChartOptions = { chart: { toolbar: { show: false } }, xaxis: { categories: ['Low', 'Medium', 'High', 'Critical'] }, colors: ['#20c997', '#fd7e14', '#e63946', '#7209b7'], plotOptions: { bar: { borderRadius: 6, distributed: true } }, legend: { show: false }};
    const severityChartSeries = [{ name: 'Events', data: [severityCounts.LOW, severityCounts.MEDIUM, severityCounts.HIGH, severityCounts.CRITICAL] }];

    const activeLabel = activeTab === 'REPORTS' ? 'User Reports' : activeTab === 'USGS' ? 'USGS Earthquakes' : 'NASA Floods';

    return (
        <div className="container-fluid px-2 px-md-4">
            <h2 className="fw-bold mb-4 d-flex align-items-center gap-2 flex-wrap">
                <span className="fs-3">⚙️</span>
                Admin Operations Center
            </h2>

            <div className="row mb-4 g-4">
                <div className="col-lg-6">
                    <div className="card card-custom h-100 p-3 p-md-4 border-0 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0">Status: {activeLabel}</h5>
                            <span className="badge bg-secondary">Total: {activeData.length}</span>
                        </div>
                        {activeData.length > 0 ? <Chart options={statusChartOptions} series={statusChartSeries} type="donut" height={260} /> : <div className="text-center py-5 text-muted">No data available.</div>}
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card card-custom h-100 p-3 p-md-4 border-0 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3"><h5 className="fw-bold mb-0">Severity: {activeLabel}</h5></div>
                        {activeData.length > 0 ? <Chart options={severityChartOptions} series={severityChartSeries} type="bar" height={260} /> : <div className="text-center py-5 text-muted">No data available.</div>}
                    </div>
                </div>
            </div>

            <ul className="nav nav-tabs nav-tabs-scrollable mb-4 pb-1">
                <li className="nav-item">
                    <button className={`nav-link text-dark ${activeTab === 'REPORTS' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('REPORTS')}>
                        📝 Manage User Reports
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link text-dark ${activeTab === 'USGS' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('USGS')}>
                        🌍 Global USGS Earthquakes
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link text-dark ${activeTab === 'NASA' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('NASA')}>
                        🌊 Global NASA Floods
                    </button>
                </li>
            </ul>

            {activeTab === 'REPORTS' && (
                <div className="card p-3 p-md-4 shadow-sm border-0 rounded-4 mb-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                        <h4 className="fw-bold mb-0">Manage User Reports</h4>
                        <input type="text" className="form-control w-100 w-md-auto" style={{ maxWidth: '300px' }} placeholder="Search user reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>

                    {isFetching ? (
                        <div className="text-center py-4"><span className="spinner-border text-primary"></span></div>
                    ) : currentReports.length === 0 ? (
                        <div className="text-center text-muted py-4"><em>No user reports found.</em></div>
                    ) : (
                        <>
                            {/* DESKTOP TABLE VIEW */}
                            <div className="table-responsive d-none d-md-block">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr><th>Title</th><th>Type</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {currentReports.map(r => (
                                            <tr key={r._id}>
                                                <td className="fw-semibold min-w-150">{r.title}</td>
                                                <td><span className="badge bg-secondary">{r.type}</span></td>
                                                <td><span className={`badge bg-${r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning text-dark' : r.status === 'REJECTED' ? 'danger' : 'primary'}`}>{r.status}</span></td>
                                                <td className="small text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="d-flex gap-1 flex-wrap">
                                                        <button className="btn btn-sm btn-outline-dark" onClick={() => setSelectedReport(r)}>View</button>
                                                        {r.status === 'PENDING' && (
                                                            <>
                                                                <button className="btn btn-sm btn-success" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'APPROVED')}>Approve</button>
                                                                <button className="btn btn-sm btn-danger" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'REJECTED')}>Reject</button>
                                                            </>
                                                        )}
                                                        {r.status === 'APPROVED' && (
                                                            <button className="btn btn-sm btn-primary" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'RESOLVED')}>Resolve</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE CARDS VIEW */}
                            <div className="d-block d-md-none">
                                {currentReports.map(r => (
                                    <div key={r._id} className="card shadow-sm mb-3 border-0 bg-light">
                                        <div className="card-body">
                                            <h5 className="fw-bold mb-2">{r.title}</h5>
                                            <div className="mb-2">
                                                <span className="badge bg-secondary me-2">{r.type}</span>
                                                <span className={`badge bg-${r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning text-dark' : r.status === 'REJECTED' ? 'danger' : 'primary'}`}>{r.status}</span>
                                            </div>
                                            <p className="small text-muted mb-3">Reported: {new Date(r.createdAt).toLocaleDateString()}</p>
                                            
                                            <div className="d-flex flex-wrap gap-2">
                                                <button className="btn btn-sm btn-outline-dark flex-fill" onClick={() => setSelectedReport(r)}>View</button>
                                                {r.status === 'PENDING' && (
                                                    <>
                                                        <button className="btn btn-sm btn-success flex-fill" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'APPROVED')}>Approve</button>
                                                        <button className="btn btn-sm btn-danger flex-fill" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'REJECTED')}>Reject</button>
                                                    </>
                                                )}
                                                {r.status === 'APPROVED' && (
                                                    <button className="btn btn-sm btn-primary flex-fill" disabled={processingId === r._id} onClick={() => initStatusUpdate(r._id, 'RESOLVED')}>Resolve</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {(activeTab === 'USGS' || activeTab === 'NASA') && (
                <>
                    <div className="card card-custom p-3 p-md-4 shadow-sm border-0 mb-4" style={{ borderLeft: '6px solid #0dcaf0' }}>
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                            <h5 className="fw-bold text-info-emphasis mb-0">
                                {activeTab === 'USGS' ? '🌍 About Global USGS Earthquake Data' : '🌊 About Global NASA Flood Data'}
                            </h5>
                            <button className="btn btn-info btn-sm text-dark fw-bold px-3 shadow-sm w-100 w-md-auto" onClick={handleSync} disabled={isSyncing}>
                                {isSyncing ? <span className="spinner-border spinner-border-sm me-2"></span> : `Sync ${activeTab === 'USGS' ? 'Earthquakes' : 'Floods'}`}
                            </button>
                        </div>
                        
                        {activeTab === 'USGS' ? (
                            <>
                                <p className="text-muted mb-2">The system automatically polls global seismic sensors via the United States Geological Survey.</p>
                                <ul className="text-muted small mb-0 ps-3">
                                    <li><strong>Earthquakes (USGS):</strong> Fetches global seismic events {'>'} 4.5 Magnitude.</li>
                                    <li><strong>Action Limits:</strong> Manual resolution actions are disabled for automated geological events.</li>
                                </ul>
                            </>
                        ) : (
                            <>
                                <p className="text-muted mb-2">The system automatically polls global satellite imagery via NASA EONET.</p>
                                <ul className="text-muted small mb-0 ps-3">
                                    <li><strong>Floods (NASA):</strong> Fetches ongoing major floods detected by Earth Observatory satellites.</li>
                                    <li><strong>Action Limits:</strong> Manual resolution actions are disabled for automated geological events.</li>
                                </ul>
                            </>
                        )}
                    </div>

                    <div className="card p-3 p-md-4 shadow-sm border-0 rounded-4 mb-4" style={{ borderTop: '5px solid #0dcaf0' }}>
                        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                            <h4 className="fw-bold mb-0">{activeTab === 'USGS' ? 'Automated Earthquake Log' : 'Automated Flood Log'}</h4>
                            <input type="text" className="form-control w-100 w-md-auto" style={{ maxWidth: '300px' }} placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>

                        {isFetching ? (
                            <div className="text-center py-4"><span className="spinner-border text-primary"></span></div>
                        ) : currentReports.length === 0 ? (
                            <div className="text-center text-muted py-4"><em>No automated data available yet.</em></div>
                        ) : (
                            <>
                                {/* DESKTOP TABLE VIEW */}
                                <div className="table-responsive d-none d-md-block">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr><th>Event Title</th><th>Source</th><th>Severity</th><th>Date Logged</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {currentReports.map(r => (
                                                <tr key={r._id}>
                                                    <td className="fw-semibold min-w-150">{r.title}</td>
                                                    <td><span className="badge bg-secondary text-nowrap">{r.source}</span></td>
                                                    <td><span className={getSeverityBadge(r.severity)}>{r.severity}</span></td>
                                                    <td className="small text-muted text-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-dark text-nowrap" onClick={() => setSelectedReport(r)}>View Details</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* MOBILE CARDS VIEW */}
                                <div className="d-block d-md-none">
                                    {currentReports.map(r => (
                                        <div key={r._id} className="card shadow-sm mb-3 border-0 bg-light border-start border-4 border-info">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-2">{r.title}</h5>
                                                <div className="mb-2">
                                                    <span className="badge bg-secondary me-2">{r.source}</span>
                                                    <span className={getSeverityBadge(r.severity)}>{r.severity}</span>
                                                </div>
                                                <p className="small text-muted mb-3">Logged: {new Date(r.createdAt).toLocaleDateString()}</p>
                                                <button className="btn btn-sm btn-outline-dark w-100" onClick={() => setSelectedReport(r)}>View Details</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {!isFetching && totalPages > 1 && (
                <div className="card p-3 shadow-sm border-0 rounded-4 mb-4">
                    <nav>
                        <ul className="pagination justify-content-center flex-wrap gap-1 mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link rounded" onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button></li>
                            <li className="page-item disabled d-none d-sm-block"><span className="page-link border-0 bg-transparent">Page {currentPage} of {totalPages}</span></li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}><button className="page-link rounded" onClick={() => setCurrentPage(prev => prev + 1)}>Next</button></li>
                        </ul>
                    </nav>
                </div>
            )}

            {/* SHARED MODALS */}
            {selectedReport && (
                <div className="custom-modal-overlay" onClick={(e) => { if (e.target.className === 'custom-modal-overlay') setSelectedReport(null); }}>
                    <div className="custom-modal-content">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <h3 className="fw-bold text-danger mb-0">{selectedReport.title}</h3>
                            <button className="btn-close" onClick={() => setSelectedReport(null)}></button>
                        </div>
                        <div className="mb-3 d-flex flex-wrap gap-2">
                            <span className="badge bg-dark">Type: {selectedReport.type}</span>
                            <span className={getSeverityBadge(selectedReport.severity)}>Severity: {selectedReport.severity}</span>
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
                            
                            {/* NEW: DISPLAY PHONE NUMBER */}
                            {selectedReport.reportedBy?.phone && (
                                <><strong>Contact Number:</strong> {selectedReport.reportedBy.phone}<br/></>
                            )}
                            
                            <strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleString()}
                        </div>
                        {selectedReport.source === 'USER' && selectedReport.imageContentType && (
                            <div className="mb-4 text-center">
                                <strong>Attached Image:</strong><br/>
                                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/disasters/${selectedReport._id}/image`} alt="Disaster Evidence" className="img-fluid rounded mt-2 border max-h-50" style={{maxHeight: '300px', objectFit: 'contain'}} onError={(e) => e.target.style.display = 'none'} />
                            </div>
                        )}
                        <div className="d-flex justify-content-end gap-2 border-top pt-3">
                            <button className="btn btn-secondary w-100 w-md-auto" onClick={() => setSelectedReport(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

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
                        <div className="d-flex flex-wrap justify-content-end gap-2">
                            <button className="btn btn-secondary flex-fill" disabled={processingId === actionConfig.id} onClick={() => setActionConfig(null)}>Cancel</button>
                            <button className={`btn btn-${actionConfig.status === 'APPROVED' ? 'success' : 'danger'} fw-bold flex-fill`} disabled={processingId === actionConfig.id}
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
