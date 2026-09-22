import os

def create_file(file_path, content):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f"Updated: {file_path}")

files = {

# ==========================================
# 1. BACKEND: Enforce new categories in Database
# ==========================================
"backend/src/models/DisasterReport.js": r"""
const mongoose = require('mongoose');

const disasterReportSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        // STRICT ENUM: Only allows these exact disaster types
        enum: ['Flood', 'Landslides', 'Earthquake', 'Other'] 
    },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    description: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    landmark: { type: String },
    image: { type: Buffer },
    imageContentType: { type: String },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'RESOLVED', 'REJECTED'], default: 'PENDING' },
    source: { type: String, enum: ['USER', 'USGS', 'NASA EONET'], default: 'USER' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminMessage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DisasterReport', disasterReportSchema);
""",

# ==========================================
# 2. FRONTEND: Update the Dropdown Menu
# ==========================================
"frontend/src/pages/ReportDisaster.jsx": r"""
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';

const ReportDisaster = () => {
    const [form, setForm] = useState({ title: '', type: '', severity: 'MEDIUM', description: '', latitude: '', longitude: '', landmark: '' });
    const [image, setImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setForm(prev => ({ ...prev, latitude: position.coords.latitude, longitude: position.coords.longitude }));
            });
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Submitting report...');
        
        const formData = new FormData();
        Object.keys(form).forEach(key => formData.append(key, form[key]));
        if (image) formData.append('image', image);

        try {
            await API.post('/disasters', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Emergency reported successfully', { id: toastId });
            navigate('/my-reports');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit report', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mt-4 mb-5">
            <div className="card shadow-sm border-0 p-4 p-md-5 mx-auto" style={{ maxWidth: '800px', borderRadius: '15px' }}>
                <h2 className="fw-bold mb-4 text-danger d-flex align-items-center gap-2">
                    <span className="fs-3">🚨</span> Report an Emergency
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-12">
                            <label className="form-label fw-bold">Incident Title</label>
                            <input type="text" className="form-control" placeholder="E.g., Major flooding on Main St" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                        </div>
                        
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Disaster Type</label>
                            <select className="form-select" required value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                <option value="">-- Select Type --</option>
                                <option value="Flood">🌊 Flood</option>
                                <option value="Landslides">⛰️ Landslides</option>
                                <option value="Earthquake">🏚️ Earthquake</option>
                                <option value="Other">⚠️ Other</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">Severity</label>
                            <select className="form-select" required value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
                                <option value="LOW">Low - No immediate danger</option>
                                <option value="MEDIUM">Medium - Property damage likely</option>
                                <option value="HIGH">High - Life-threatening</option>
                                <option value="CRITICAL">Critical - Mass casualties</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">Latitude</label>
                            <input type="number" step="any" className="form-control" required value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Longitude</label>
                            <input type="number" step="any" className="form-control" required value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} />
                        </div>

                        <div className="col-md-12">
                            <label className="form-label fw-bold">Nearest Landmark</label>
                            <input type="text" className="form-control" placeholder="E.g., Near City Mall" value={form.landmark} onChange={e => setForm({...form, landmark: e.target.value})} />
                        </div>

                        <div className="col-md-12">
                            <label className="form-label fw-bold">Description</label>
                            <textarea className="form-control" rows="4" placeholder="Describe the situation..." required value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
                        </div>

                        <div className="col-md-12">
                            <label className="form-label fw-bold">Attach Evidence (Image)</label>
                            <input type="file" className="form-control" accept="image/*" onChange={e => setImage(e.target.files[0])} />
                        </div>
                    </div>
                    
                    <hr className="my-4" />
                    <button type="submit" className="btn btn-danger btn-lg w-100 fw-bold rounded-pill" disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Submit Emergency Report'}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default ReportDisaster;
""",

# ==========================================
# 3. FRONTEND: Remove "National" from Home Page
# ==========================================
"frontend/src/pages/HomeInfo.jsx": r"""
import React from 'react';
import { Link } from 'react-router-dom';

const HomeInfo = () => {
    const storedUser = localStorage.getItem('userInfo');
    const userInfo = storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;

    return (
        <div className="container mt-2">
            <div className="text-center mb-5 bg-white p-5 rounded-4 shadow-sm border">
                {/* REMOVED "National" from Title */}
                <h1 className="display-4 text-gradient-dark fw-bold mb-3">Emergency Response & Tracking</h1>
                <p className="lead text-secondary mx-auto" style={{maxWidth: '800px'}}>
                    A centralized platform designed to crowdsource emergency reports, map natural disasters in real-time, and streamline administrative response.
                </p>
                <div className="mt-4 d-flex justify-content-center gap-3 flex-wrap">
                    <Link to="/report" className="btn btn-danger btn-lg rounded-pill px-5 shadow-sm">🚨 Report an Emergency</Link>
                    
                    {!userInfo && (
                        <Link to="/login" className="btn btn-outline-dark btn-lg rounded-pill px-5 shadow-sm">Login to Dashboard</Link>
                    )}
                </div>
            </div>

            <h3 className="text-center fw-bold mb-4">How The System Works</h3>
            <div className="row g-4 mb-5 text-center">
                <div className="col-md-4">
                    <div className="card card-custom h-100 p-4 border-0">
                        <h1 className="display-4 mb-3">📱</h1><h4 className="fw-bold">1. Report</h4>
                        <p className="text-muted">Citizens report floods, fires, or earthquakes using exact GPS coordinates.</p>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card card-custom h-100 p-4 border-0">
                        <h1 className="display-4 mb-3">🗺️</h1><h4 className="fw-bold">2. Track</h4>
                        <p className="text-muted">System integrates crowdsourced data with automated global feeds.</p>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card card-custom h-100 p-4 border-0">
                        <h1 className="display-4 mb-3">🛡️</h1><h4 className="fw-bold">3. Respond</h4>
                        <p className="text-muted">Admin agencies review, approve, and dispatch services accurately.</p>
                    </div>
                </div>
            </div>
            
            <div className="row g-4 mb-4">
                <div className="col-md-12">
                    <div className="card card-custom h-100 p-4">
                        <h3 className="text-primary fw-bold mb-4">📖 What to do during a Disaster?</h3>
                        <div className="accordion" id="disasterAccordion">
                            <div className="accordion-item bg-transparent border-secondary">
                                <h2 className="accordion-header"><button className="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#flood">🌊 Floods</button></h2>
                                <div id="flood" className="accordion-collapse collapse" data-bs-parent="#disasterAccordion">
                                    <div className="accordion-body">Move to higher ground immediately. Turn off utilities. Do not walk/drive through moving water. Keep emergency kit ready.</div>
                                </div>
                            </div>
                            <div className="accordion-item bg-transparent border-secondary">
                                <h2 className="accordion-header"><button className="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#earthquake">🏚️ Earthquakes</button></h2>
                                <div id="earthquake" className="accordion-collapse collapse" data-bs-parent="#disasterAccordion">
                                    <div className="accordion-body"><strong>DROP, COVER, AND HOLD ON.</strong> Stay away from glass/windows. Do not use elevators.</div>
                                </div>
                            </div>
                            <div className="accordion-item bg-transparent border-secondary border-bottom-0">
                                <h2 className="accordion-header"><button className="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#landslide">⛰️ Landslides</button></h2>
                                <div id="landslide" className="accordion-collapse collapse" data-bs-parent="#disasterAccordion">
                                    <div className="accordion-body">Move away from the path of the landslide or debris flow as quickly as possible. Avoid river valleys and low-lying areas.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default HomeInfo;
"""
}

print("Updating disaster categories and removing the word 'National'...")
for file_path, file_content in files.items():
    create_file(file_path, file_content)

print("\nSuccess! The system is now scoped to Flood, Landslides, Earthquake, and Other.")