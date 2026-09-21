import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // REGEX Patterns
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/; // Exactly 10 digits

    // REAL-TIME VALIDATION CHECKS
    const isNameValid = form.name.trim().length >= 3;
    const isEmailValid = emailRegex.test(form.email);
    const isPhoneValid = phoneRegex.test(form.phone);
    const isPasswordValid = form.password.length >= 6;

    // Button is ONLY enabled if all conditions are absolutely true
    const isFormValid = isNameValid && isEmailValid && isPhoneValid && isPasswordValid;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return; // Prevent submission if button bypass is attempted
        
        setIsLoading(true);
        const toastId = toast.loading("Creating your account...");
        
        try {
            const { data } = await API.post('/auth/register', form);
            localStorage.setItem('userInfo', JSON.stringify(data.data));
            toast.success("Registration successful! Welcome aboard.", { id: toastId }); 
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
                            <input type="text" className={`form-control form-control-lg bg-light ${form.name && !isNameValid ? 'is-invalid' : ''}`} placeholder="E.g. John Doe" required onChange={e => setForm({...form, name: e.target.value})} disabled={isLoading} />
                            {form.name && !isNameValid && <div className="invalid-feedback fw-bold">Name must be at least 3 characters.</div>}
                        </div>
                        
                        <div className="mb-3">
                            <label className="form-label fw-bold text-secondary">Email Address</label>
                            <input type="email" className={`form-control form-control-lg bg-light ${form.email && !isEmailValid ? 'is-invalid' : ''}`} placeholder="name@example.com" required onChange={e => setForm({...form, email: e.target.value})} disabled={isLoading} />
                            {form.email && !isEmailValid && <div className="invalid-feedback fw-bold">Please enter a valid email format.</div>}
                        </div>
                        
                        <div className="mb-3">
                            <label className="form-label fw-bold text-secondary">Mobile Number</label>
                            <input 
                                type="tel" 
                                className={`form-control form-control-lg bg-light ${form.phone && !isPhoneValid ? 'is-invalid' : ''}`} 
                                placeholder="10-digit number" 
                                required 
                                maxLength="10"
                                onChange={e => {
                                    // Strip out any non-numeric characters instantly
                                    const numericOnly = e.target.value.replace(/\D/g, '');
                                    setForm({...form, phone: numericOnly});
                                }} 
                                value={form.phone}
                                disabled={isLoading} 
                            />
                            {form.phone && !isPhoneValid && <div className="invalid-feedback fw-bold">Mobile number must be exactly 10 digits.</div>}
                        </div>
                        
                        <div className="mb-4">
                            <label className="form-label fw-bold text-secondary">Password</label>
                            <input type="password" className={`form-control form-control-lg bg-light ${form.password && !isPasswordValid ? 'is-invalid' : ''}`} placeholder="Min. 6 characters" required onChange={e => setForm({...form, password: e.target.value})} disabled={isLoading} />
                            {form.password && !isPasswordValid && <div className="invalid-feedback fw-bold">Password must be at least 6 characters long.</div>}
                        </div>
                        
                        <button type="submit" className="btn btn-dark btn-lg w-100 rounded-pill shadow-sm" disabled={isLoading || !isFormValid}>
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
