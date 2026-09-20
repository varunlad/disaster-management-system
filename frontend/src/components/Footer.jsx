import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-dark text-light py-4 mt-auto">
            <div className="container text-center">
                <h5 className="mb-3 fw-bold">National Disaster Management System</h5>
                <p className="small text-muted mb-3">Designed for rapid emergency response and real-time crisis mapping across India.</p>
                {/* FIX: Added flex-wrap to prevent breaking on small mobile screens */}
                <div className="d-flex justify-content-center flex-wrap gap-2 mb-3">
                    <span className="badge bg-danger fs-6 p-2">Emergency: 112</span>
                    <span className="badge bg-primary fs-6 p-2">Police: 100</span>
                    <span className="badge bg-warning text-dark fs-6 p-2">Fire: 101</span>
                    <span className="badge bg-info text-dark fs-6 p-2">Ambulance: 102</span>
                </div>
                <hr className="border-secondary" />
                <p className="small mb-0">&copy; {new Date().getFullYear()} Disaster Management System. All rights reserved.</p>
            </div>
        </footer>
    );
};
export default Footer;
