import { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const DisasterNews = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const newsPerPage = 9;

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const { data } = await API.get('/disasters/news');
                setNews(data.data);
            } catch (error) { toast.error("Failed to load disaster news"); } 
            finally { setLoading(false); }
        };
        fetchNews();
    }, []);

    const indexOfLastNews = currentPage * newsPerPage;
    const indexOfFirstNews = indexOfLastNews - newsPerPage;
    const currentNews = news.slice(indexOfFirstNews, indexOfLastNews);
    const totalPages = Math.ceil(news.length / newsPerPage);

    return (
        <div className="container mt-2">
            <div className="text-center mb-5">
                <h1 className="display-4 text-gradient-dark fw-bold">Global Disaster Events</h1>
                <p className="lead text-muted mx-auto" style={{ maxWidth: '800px' }}>
                    This section provides a live, globally curated feed of natural disaster events from the past 7 days, tracked directly by NASA's Earth Observatory.
                </p>
                {!loading && <span className="badge bg-secondary px-3 py-2 mt-2">Displaying {news.length} events from the last 7 days</span>}
            </div>

            {loading ? (
                <div className="text-center mt-5">
                    <span className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}></span>
                    <p className="mt-3 text-muted fw-bold">Connecting to NASA Satellites...</p>
                </div>
            ) : news.length === 0 ? (
                 <div className="alert alert-info text-center">No recent disaster events found in the past 7 days.</div>
            ) : (
                <>
                    <div className="row g-4 mb-5">
                        {currentNews.map((item) => (
                            <div className="col-md-4" key={item.id}>
                                <div className="card card-custom h-100 d-flex flex-column border-0 shadow-sm p-4">
                                    <span className="badge bg-danger mb-3 px-3 py-2 rounded-pill shadow-sm w-auto align-self-start">{item.categories}</span>
                                    <h5 className="fw-bold mb-3 lh-base">{item.title}</h5>
                                    
                                    <div className="text-muted small mb-3">
                                        <div className="mb-1"><strong>📅 Last Update:</strong> {new Date(item.date).toLocaleString()}</div>
                                        {/* Display NASA Magnitude Details if present */}
                                        {item.magnitude && <div className="mb-1 text-danger"><strong>⚠️ Intensity:</strong> {item.magnitude}</div>}
                                        {item.coordinates.length > 0 && <div><strong>📍 GPS:</strong> {item.coordinates[1]?.toFixed(3)}, {item.coordinates[0]?.toFixed(3)}</div>}
                                    </div>
                                    
                                    <p className="text-primary small fw-bold mb-0 mt-auto pt-2 border-top">
                                        🏢 Source: NASA EONET
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <nav className="mt-4">
                            <ul className="pagination justify-content-center mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
                                </li>
                                <li className="page-item disabled">
                                    <span className="page-link">Page {currentPage} of {totalPages}</span>
                                </li>
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
};
export default DisasterNews;
