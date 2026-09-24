import React from 'react';
import { Link } from 'react-router-dom';

const HomeInfo = () => {
    const storedUser = localStorage.getItem('userInfo');
    const userInfo = storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;

    return (
        <div className="container mt-2">
            <div className="text-center mb-5 bg-white p-5 rounded-4 shadow-sm border">
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
                            <div className="accordion-item bg-transparent border-secondary">
                                <h2 className="accordion-header"><button className="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#landslide">⛰️ Landslides</button></h2>
                                <div id="landslide" className="accordion-collapse collapse" data-bs-parent="#disasterAccordion">
                                    <div className="accordion-body">Move away from the path of the landslide or debris flow as quickly as possible. Avoid river valleys and low-lying areas.</div>
                                </div>
                            </div>
                            {/* FIX: Removed the rogue border-bottom-0 class to restore the clean outline */}
                            <div className="accordion-item bg-transparent border-secondary">
                                <h2 className="accordion-header"><button className="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#other">⚠️ Other Emergencies</button></h2>
                                <div id="other" className="accordion-collapse collapse" data-bs-parent="#disasterAccordion">
                                    <div className="accordion-body">Assess the situation calmly. Contact local authorities immediately. Follow evacuation protocols if instructed and ensure your personal safety first.</div>
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
