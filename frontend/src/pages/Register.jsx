import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false); // Optimization
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading("Creating your account...");
        try {
            const { data } = await API.post('/auth/register', form);
            localStorage.setItem('userInfo', JSON.stringify(data.data));
            toast.success("Registration successful!", { id: toastId }); 
            navigate('/');
        } catch (error) { 
            toast.error(error.response?.data?.message || "Registration failed", { id: toastId }); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="card card-custom auth-card shadow-lg p-0" style={{ borderTop: '5px solid #203a43' }}>
                <div className="p-4 p-md-5">
                    <div className="text-center mb-4">
                        <h2 className="fw-bold text-gradient-dark">Join the Network</h2>
                        <p className="text-muted small">Create an account to report emergencies.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-bold text-secondary">Full Name</label>
                            <input type="text" className="form-control form-control-lg bg-light" placeholder="John Doe" required onChange={e => setForm({...form, name: e.target.value})} disabled={isLoading} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold text-secondary">Email Address</label>
                            <input type="email" className="form-control form-control-lg bg-light" placeholder="name@example.com" required onChange={e => setForm({...form, email: e.target.value})} disabled={isLoading} />
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold text-secondary">Password</label>
                            <input type="password" className="form-control form-control-lg bg-light" placeholder="Create a strong password" required onChange={e => setForm({...form, password: e.target.value})} disabled={isLoading} />
                        </div>
                        <button type="submit" className="btn btn-dark btn-lg w-100 rounded-pill shadow-sm" disabled={isLoading}>
                            {isLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Register Account'}
                        </button>
                    </form>
                    
                    <div className="text-center mt-4 border-top pt-3">
                        <p className="text-muted mb-0">Already have an account?</p>
                        <Link to="/login" className={`text-primary fw-bold text-decoration-none ${isLoading ? 'pe-none opacity-50' : ''}`}>Sign in here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Register;
