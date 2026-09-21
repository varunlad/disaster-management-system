import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    document.documentElement.setAttribute('data-bs-theme', 'light');

    const handleLogout = () => { 
        localStorage.removeItem('userInfo'); 
        navigate('/login'); 
    };
    const isActive = (path) => location.pathname === path ? 'active-tab' : '';

    return (
        <nav className="navbar navbar-expand-lg navbar-dark navbar-custom px-3 py-3">
            <Link className="navbar-brand fw-bold fs-4 d-flex align-items-center gap-2" to="/">
                <span className="fs-3">🛡️</span>
                <span>Disaster Management</span>
            </Link>
            
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav ms-auto align-items-center">
                    <li className="nav-item"><Link className={`nav-link fs-5 ${isActive('/')}`} to="/">Home</Link></li>
                    <li className="nav-item"><Link className={`nav-link fs-5 ${isActive('/news')}`} to="/news">Disaster News</Link></li>
                    
                    {userInfo ? (
                        <>
                            <li className="nav-item"><Link className={`nav-link fs-5 ${isActive('/report')}`} to="/report">Report Emergency</Link></li>
                            <li className="nav-item"><Link className={`nav-link fs-5 ${isActive('/my-reports')}`} to="/my-reports">My Reports</Link></li>
                            {userInfo.role === 'ADMIN' && (
                                <li className="nav-item">
                                    <Link className={`nav-link fs-5 text-warning ${isActive('/admin')}`} to="/admin">Admin Dashboard</Link>
                                </li>
                            )}
                            <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
                                <button className="btn btn-outline-light rounded-pill px-4" onClick={handleLogout}>Logout</button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="nav-item ms-lg-2 mt-2 mt-lg-0"><Link className="btn btn-outline-light rounded-pill px-4" to="/login">Login</Link></li>
                            <li className="nav-item ms-lg-2 mt-2 mt-lg-0"><Link className="btn btn-light text-dark rounded-pill px-4 fw-bold" to="/register">Register</Link></li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};
export default Navbar;
