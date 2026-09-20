import { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const MyReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyReports = async () => {
            try {
                const { data } = await API.get('/disasters/my-reports'); setReports(data.data);
            } catch (error) { toast.error("Failed to load your reports"); } 
            finally { setLoading(false); }
        };
        fetchMyReports();
    }, []);

    const getStatusBadge = (status) => {
        switch(status) {
            case 'APPROVED': return 'badge bg-success';
            case 'PENDING': return 'badge bg-warning text-dark';
            case 'REJECTED': return 'badge bg-danger';
            case 'RESOLVED': return 'badge bg-primary';
            default: return 'badge bg-secondary';
        }
    };

    return (
        <div className="container" style={{ maxWidth: '900px' }}>
            <h2 className="mb-4 fw-bold">My Report History</h2>
            {loading ? (
                <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>
            ) : reports.length === 0 ? (
                <div className="alert alert-info text-center">You have not submitted any emergency reports yet.</div>
            ) : (
                <div className="row g-4">
                    {reports.map(r => (
                        <div className="col-12" key={r._id}>
                            <div className="card shadow-sm border-0">
                                <div className="card-body row align-items-center">
                                    <div className="col-md-8">
                                        <h5 className="fw-bold mb-1">{r.title}</h5>
                                        <p className="text-muted small mb-2">{new Date(r.createdAt).toLocaleString()}</p>
                                        <p className="mb-2">{r.description}</p>
                                        
                                        {/* DISPLAY LANDMARK HERE */}
                                        {r.landmark && <p className="mb-2 text-primary small"><strong>📍 Landmark:</strong> {r.landmark}</p>}

                                        <div className="d-flex flex-wrap gap-2 text-sm mb-3 mt-2">
                                            <span className="badge bg-light text-dark border">Type: {r.type}</span>
                                            <span className="badge bg-light text-dark border">Severity: {r.severity}</span>
                                        </div>
                                        
                                        {r.adminMessage && (
                                            <div className="p-3 bg-light border-start border-4 border-info rounded text-dark">
                                                <strong className="text-info-emphasis">Response from Admin:</strong>
                                                <p className="mb-0 mt-1">{r.adminMessage}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                                        <h6 className="text-muted mb-1">Status</h6>
                                        <span className={`fs-6 px-3 py-2 ${getStatusBadge(r.status)}`}>{r.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default MyReports;
