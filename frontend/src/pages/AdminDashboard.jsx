import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import toast from 'react-hot-toast';
import API from '../utils/api';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('REPORTS'); 
    const [activeData, setActiveData] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null); 
    const [selectedReportImageUrl, setSelectedReportImageUrl] = useState(null);
    const [actionConfig, setActionConfig] = useState(null); 
    const [adminMessage, setAdminMessage] = useState('');
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [aiPlan, setAiPlan] = useState(null);

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

    useEffect(() => {
        let objectUrl = null;
        if (selectedReport && selectedReport.imageContentType) {
            const fetchImage = async () => {
                try {
                    const res = await API.get(`/disasters/${selectedReport._id}/image`, { responseType: 'blob' });
                    objectUrl = URL.createObjectURL(res.data);
                    setSelectedReportImageUrl(objectUrl);
                } catch (e) { console.error("Failed to load image", e); }
            };
            fetchImage();
        } else {
            setSelectedReportImageUrl(null);
        }
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [selectedReport]);

    const filteredReports = activeData.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
    const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    // NEW SMART AI GENERATOR LOGIC
    const generateAIPlan = (report) => {
        const { type, severity, title } = report;
        
        let teamScale = "";
        let protocol = "";

        // 1. Analyze Severity for Scale and Protocol
        switch(severity) {
            case 'LOW':
                teamScale = "2 to 3-person Assessment";
                protocol = "Assess scene and report status. Implement non-emergency traffic routing. Target ETA 60 minutes.";
                break;
            case 'MEDIUM':
                teamScale = "5 to 8-person Rapid Response";
                protocol = "Secure perimeter and initiate standard containment. Target deployment within 30 minutes.";
                break;
            case 'HIGH':
                teamScale = "12 to 15-person Specialized";
                protocol = "Immediate area evacuation. Establish on-site triage. Target deployment within 15 minutes.";
                break;
            case 'CRITICAL':
                teamScale = "25+ person Multi-Agency Task Force";
                protocol = "Declare local emergency. Initiate immediate life-saving ops & standby for air support. Zero-delay deployment.";
                break;
            default:
                teamScale = "Standard Response";
                protocol = "Deploy to site and evaluate.";
        }

        // 2. Analyze Type for Gear, Contact, and Team Name
        let team = `${teamScale} Team`;
        let gear = "Standard emergency medical and lighting kits";
        let contact = "Local Authorities & First Responders";

        if (type === 'Flood') { 
            team = `${teamScale} Swift Water Rescue Unit`; 
            gear = (severity === 'HIGH' || severity === 'CRITICAL') 
                ? "Multiple inflatable zodiac boats, rescue helicopters, sonar devices, and high-capacity water pumps"
                : "Life vests, throw ropes, and portable water pumps";
            contact = "Disaster Response Force Water Division & Coast Guard"; 
        }
        else if (type === 'Earthquake') { 
            team = `${teamScale} Urban Search & Rescue (USAR) Squad`; 
            gear = (severity === 'HIGH' || severity === 'CRITICAL')
                ? "Heavy concrete lifting equipment, K9 units, thermal imaging, and acoustic detectors"
                : "Basic structural bracing, triage kits, and lighting towers";
            contact = "State Disaster Management Authority (SDMA) & Local Fire Department"; 
        }
        else if (type === 'Landslides') { 
            team = `${teamScale} Geological Clearance & Rescue Team`; 
            gear = (severity === 'HIGH' || severity === 'CRITICAL')
                ? "Heavy earth-moving machinery (excavators), drone aerial surveyors, and ground-penetrating radar"
                : "Shovels, stabilization gear, and manual clearing equipment";
            contact = "Highway Patrol & Local Civil Engineering Contractors"; 
        }

        return {
            threat: `${title} (${severity} Severity)`,
            team, gear, contact, protocol
        };
    };

    const initStatusUpdate = (report, status) => {
        setActionConfig({ report, status });
        setAdminMessage('');
        
        if (status === 'APPROVED') {
            setIsAIGenerating(true);
            setAiPlan(null);
            setTimeout(() => {
                setAiPlan(generateAIPlan(report));
                setIsAIGenerating(false);
            }, 3000);
        }
    };

    const handleStatusChange = async (id, status, msg) => {
        setProcessingId(id); 
        const toastId = toast.loading("Updating status...");
        try {
            let finalMessage = msg;
            if (aiPlan) {
                finalMessage = `${msg}\n\n--- SYSTEM REMEDIATION PLAN ---\nThreat: ${aiPlan.threat}\nTeam: ${aiPlan.team}\nGear: ${aiPlan.gear}\nContact: ${aiPlan.contact}\nProtocol: ${aiPlan.protocol}`;
            }

            await API.put(`/admin/disasters/${id}/status`, { status, adminMessage: finalMessage });
            toast.success(`Report marked as ${status}`, { id: toastId }); 
            await fetchDataForTab(activeTab); 
            
            if (selectedReport && selectedReport._id === id) { 
                setSelectedReport({ ...selectedReport, status, adminMessage: finalMessage }); 
            }
            setActionConfig(null); 
            setAiPlan(null);
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

    return (
        <div className="container-fluid px-2 px-md-4">
            <h2 className="fw-bold mb-4 d-flex align-items-center gap-2 flex-wrap">
                <span className="fs-3">⚙️</span> Admin Operations Center
            </h2>

            <div className="row mb-4 g-4">
                <div className="col-lg-6">
                    <div className="card card-custom h-100 p-3 p-md-4 border-0 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0">Status: {activeTab === 'REPORTS' ? 'User Reports' : activeTab === 'USGS' ? 'USGS Earthquakes' : 'NASA Floods'}</h5>
                            <span className="badge bg-secondary">Total: {activeData.length}</span>
                        </div>
                        {activeData.length > 0 ? <Chart options={statusChartOptions} series={statusChartSeries} type="donut" height={260} /> : <div className="text-center py-5 text-muted">No data available.</div>}
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card card-custom h-100 p-3 p-md-4 border-0 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3"><h5 className="fw-bold mb-0">Severity Distribution</h5></div>
                        {activeData.length > 0 ? <Chart options={severityChartOptions} series={severityChartSeries} type="bar" height={260} /> : <div className="text-center py-5 text-muted">No data available.</div>}
                    </div>
                </div>
            </div>

            <ul className="nav nav-tabs nav-tabs-scrollable mb-4 pb-1">
                <li className="nav-item"><button className={`nav-link text-dark ${activeTab === 'REPORTS' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('REPORTS')}>📝 Manage User Reports</button></li>
                <li className="nav-item"><button className={`nav-link text-dark ${activeTab === 'USGS' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('USGS')}>🌍 Global USGS Earthquakes</button></li>
                <li className="nav-item"><button className={`nav-link text-dark ${activeTab === 'NASA' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('NASA')}>🌊 Global NASA Floods</button></li>
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
                            <div className="table-responsive d-none d-md-block">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light"><tr><th>Title</th><th>Type</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
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
                                                                <button className="btn btn-sm btn-success" disabled={processingId === r._id} onClick={() => initStatusUpdate(r, 'APPROVED')}>Approve</button>
                                                                <button className="btn btn-sm btn-danger" disabled={processingId === r._id} onClick={() => initStatusUpdate(r, 'REJECTED')}>Reject</button>
                                                            </>
                                                        )}
                                                        {r.status === 'APPROVED' && (
                                                            <button className="btn btn-sm btn-primary" disabled={processingId === r._id} onClick={() => initStatusUpdate(r, 'RESOLVED')}>Resolve</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

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
                                                        <button className="btn btn-sm btn-success flex-fill" disabled={processingId === r._id} onClick={() => initStatusUpdate(r, 'APPROVED')}>Approve</button>
                                                        <button className="btn btn-sm btn-danger flex-fill" disabled={processingId === r._id} onClick={() => initStatusUpdate(r, 'REJECTED')}>Reject</button>
                                                    </>
                                                )}
                                                {r.status === 'APPROVED' && (
                                                    <button className="btn btn-sm btn-primary flex-fill" disabled={processingId === r._id} onClick={() => initStatusUpdate(r, 'RESOLVED')}>Resolve</button>
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
                            <h5 className="fw-bold text-info-emphasis mb-0">{activeTab === 'USGS' ? '🌍 About Global USGS Earthquake Data' : '🌊 About Global NASA Flood Data'}</h5>
                            <button className="btn btn-info btn-sm text-dark fw-bold px-3 shadow-sm w-100 w-md-auto" onClick={handleSync} disabled={isSyncing}>
                                {isSyncing ? <span className="spinner-border spinner-border-sm me-2"></span> : `Sync ${activeTab === 'USGS' ? 'Earthquakes' : 'Floods'}`}
                            </button>
                        </div>
                    </div>

                    <div className="card p-3 p-md-4 shadow-sm border-0 rounded-4 mb-4" style={{ borderTop: '5px solid #0dcaf0' }}>
                        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                            <h4 className="fw-bold mb-0">{activeTab === 'USGS' ? 'Automated Earthquake Log' : 'Automated Flood Log'}</h4>
                            <input type="text" className="form-control w-100 w-md-auto" style={{ maxWidth: '300px' }} placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        
                        {isFetching ? (
                            <div className="text-center py-4"><span className="spinner-border text-primary"></span></div>
                        ) : currentReports.length === 0 ? (
                            <div className="text-center text-muted py-4"><em>No automated data available yet. Click Sync to fetch from global grids.</em></div>
                        ) : (
                            <>
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
                        
                        {selectedReport.source === 'USER' && selectedReport.imageContentType && (
                            <div className="mb-4 text-center">
                                <strong className="d-block mb-2 text-start">Attached Evidence:</strong>
                                {selectedReportImageUrl ? (
                                    <img src={selectedReportImageUrl} alt="Disaster Evidence" className="img-fluid rounded border shadow-sm" style={{maxHeight: '350px', objectFit: 'contain'}} />
                                ) : (
                                    <div className="py-4 bg-light rounded border"><span className="spinner-border spinner-border-sm me-2 text-primary"></span>Loading secure image...</div>
                                )}
                            </div>
                        )}

                        <div className="mb-3 text-muted small">
                            <strong>Reported By:</strong> {selectedReport.reportedBy?.name || 'System (Auto)'} ({selectedReport.reportedBy?.email || selectedReport.source})<br/>
                            {selectedReport.reportedBy?.phone && ( <><strong>Contact Number:</strong> {selectedReport.reportedBy.phone}<br/></> )}
                        </div>
                        <div className="d-flex justify-content-end gap-2 border-top pt-3">
                            <button className="btn btn-secondary w-100 w-md-auto" onClick={() => setSelectedReport(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION & AI MODAL */}
            {actionConfig && (
                <div className="custom-modal-overlay" style={{ zIndex: 1060 }}>
                    <div className="custom-modal-content" style={{ maxWidth: '650px' }}>
                        
                        {actionConfig.status !== 'APPROVED' && (
                            <>
                                <h4 className="fw-bold mb-3 text-danger">Confirm Action: {actionConfig.status}</h4>
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Message to User (Mandatory) <span className="text-danger">*</span></label>
                                    <textarea className="form-control" rows="3" placeholder="Provide a reason..." value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)}></textarea>
                                </div>
                                <div className="d-flex flex-wrap justify-content-end gap-2">
                                    <button className="btn btn-secondary flex-fill" disabled={processingId === actionConfig.report._id} onClick={() => setActionConfig(null)}>Cancel</button>
                                    <button className="btn btn-danger fw-bold flex-fill" disabled={processingId === actionConfig.report._id} onClick={() => { if (!adminMessage.trim()) return toast.error('An admin message is mandatory!'); handleStatusChange(actionConfig.report._id, actionConfig.status, adminMessage); }}>
                                        {processingId === actionConfig.report._id ? <span className="spinner-border spinner-border-sm"></span> : `Confirm ${actionConfig.status}`}
                                    </button>
                                </div>
                            </>
                        )}

                        {actionConfig.status === 'APPROVED' && (
                            <>
                                {isAIGenerating ? (
                                    <div className="text-center py-5">
                                        <div className="ai-core"></div>
                                        <h4 className="ai-text mb-2">AI Architecting Response Matrix...</h4>
                                        <p className="text-muted small">Cross-referencing {actionConfig.report.type} protocol against {actionConfig.report.severity} severity parameters.</p>
                                    </div>
                                ) : (
                                    <div className="fade-in">
                                        <h4 className="fw-bold mb-3 text-success d-flex align-items-center gap-2 border-bottom pb-2">
                                            <span>⚡</span> System Remediation Plan Ready
                                        </h4>
                                        
                                        {aiPlan && (
                                            <div className="bg-light p-3 rounded mb-4 shadow-sm border border-success-subtle">
                                                <div className="d-flex align-items-center mb-2">
                                                    <span className="badge bg-danger me-2" style={{minWidth: '70px'}}>Threat</span>
                                                    <span className="fw-semibold text-dark">{aiPlan.threat}</span>
                                                </div>
                                                <div className="d-flex align-items-start mb-2">
                                                    <span className="badge bg-primary me-2 mt-1" style={{minWidth: '70px'}}>Team</span>
                                                    <span className="text-secondary">Dispatch <strong className="text-dark">{aiPlan.team}</strong></span>
                                                </div>
                                                <div className="d-flex align-items-start mb-2">
                                                    <span className="badge bg-info text-dark me-2 mt-1" style={{minWidth: '70px'}}>Gear</span>
                                                    <span className="text-secondary">{aiPlan.gear}</span>
                                                </div>
                                                <div className="d-flex align-items-start mb-3">
                                                    <span className="badge bg-warning text-dark me-2 mt-1" style={{minWidth: '70px'}}>Contact</span>
                                                    <span className="text-secondary">Establish secure comms with <strong className="text-dark">{aiPlan.contact}</strong></span>
                                                </div>
                                                <div className="alert alert-success py-2 mb-0 border-0 bg-success bg-opacity-10 d-flex align-items-center gap-2">
                                                    <span className="fs-5">⏱️</span> 
                                                    <span><strong>Protocol:</strong> {aiPlan.protocol}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <label className="form-label fw-bold">User Notification Message <span className="text-danger">*</span></label>
                                            <select className="form-select mb-2 bg-light text-secondary" onChange={(e) => { if (e.target.value) setAdminMessage(e.target.value); }}>
                                                <option value="">-- Select a quick response --</option>
                                                <option value="Rescue team dispatched. Help is on the way. Please stay safe.">Rescue team dispatched.</option>
                                                <option value="Emergency received. We are contacting local authorities.">Contacting authorities.</option>
                                            </select>
                                            <textarea className="form-control" rows="2" placeholder="Or type a custom message..." value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)}></textarea>
                                        </div>

                                        <div className="d-flex flex-wrap justify-content-end gap-2">
                                            <button className="btn btn-secondary flex-fill" disabled={processingId === actionConfig.report._id} onClick={() => setActionConfig(null)}>Cancel</button>
                                            <button className="btn btn-success fw-bold flex-fill" disabled={processingId === actionConfig.report._id} onClick={() => { 
                                                if (!adminMessage.trim()) return toast.error('A user message is mandatory!'); 
                                                handleStatusChange(actionConfig.report._id, 'APPROVED', adminMessage); 
                                            }}>
                                                {processingId === actionConfig.report._id ? <span className="spinner-border spinner-border-sm"></span> : 'Approve & Dispatch Plan'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminDashboard;
