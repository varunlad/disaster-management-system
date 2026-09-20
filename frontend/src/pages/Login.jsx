import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';

const Login = () => {
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Optimization
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading("Verifying credentials...");
        try {
            const { data } = await API.post('/auth/login', { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data.data));
            toast.success("Welcome back!", { id: toastId }); 
            navigate('/');
        } catch (error) { 
            toast.error(error.response?.data?.message || "Login failed", { id: toastId }); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="card card-custom auth-card shadow-lg p-0">
                <div className="p-4 p-md-5">
                    <div className="text-center mb-4">
                        <h2 className="fw-bold text-gradient-dark">Welcome Back</h2>
                        <p className="text-muted small">Sign in to your Disaster Management account</p>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-bold text-secondary">Email Address</label>
                            <input type="email" className="form-control form-control-lg bg-light" placeholder="name@example.com" required onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold text-secondary">Password</label>
                            <input type="password" className="form-control form-control-lg bg-light" placeholder="••••••••" required onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                        </div>
                        <button type="submit" className="btn btn-gradient btn-lg w-100 rounded-pill shadow-sm" disabled={isLoading}>
                            {isLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Secure Login'}
                        </button>
                    </form>
                    
                    <div className="text-center mt-4 border-top pt-3">
                        <p className="text-muted mb-0">Don't have an account?</p>
                        <Link to="/register" className={`text-primary fw-bold text-decoration-none ${isLoading ? 'pe-none opacity-50' : ''}`}>Create an account here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Login;
