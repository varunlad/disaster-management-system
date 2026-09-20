import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import toast from 'react-hot-toast';
import API from '../utils/api';

const LocationPicker = ({ position, setPosition, setLatInput, setLngInput }) => {
    useMapEvents({ click(e) { setPosition(e.latlng); setLatInput(e.latlng.lat.toFixed(6)); setLngInput(e.latlng.lng.toFixed(6)); } });
    return position === null ? null : <Marker position={position}></Marker>;
};

const MapCenterUpdater = ({ position }) => {
    const map = useMap();
    useEffect(() => { if (position) map.flyTo(position, 12, { animate: true, duration: 1 }); }, [position, map]);
    return null;
};

const ReportDisaster = () => {
    const navigate = useNavigate();
    // Added landmark to initial state
    const [formData, setFormData] = useState({ title: '', description: '', type: 'Flood', severity: 'MEDIUM', landmark: '' });
    const [position, setPosition] = useState(null); 
    const [latInput, setLatInput] = useState('');
    const [lngInput, setLngInput] = useState('');
    const [image, setImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const center = [22.9074872, 79.0669024];
    const indiaBounds = [[6.7535, 68.1623], [35.5042, 97.3955]];

    const handleCoordinateChange = () => {
        const lat = parseFloat(latInput); const lng = parseFloat(lngInput);
        if (!isNaN(lat) && !isNaN(lng)) setPosition({ lat, lng });
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            const locToast = toast.loading("Locating your device...");
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude; const lng = pos.coords.longitude;
                    if (lat < 6.7 || lat > 35.5 || lng < 68.1 || lng > 97.4) {
                        toast.error("Your location is outside India borders.", { id: locToast }); return;
                    }
                    setLatInput(lat.toFixed(6)); setLngInput(lng.toFixed(6));
                    setPosition({ lat, lng });
                    toast.success("Location acquired!", { id: locToast });
                },
                (err) => { toast.error("Please enable GPS/Location services.", { id: locToast }); },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!position) return toast.error("Please select a location on the map or enter coordinates.");
        
        setIsSubmitting(true);
        const data = new FormData();
        data.append('title', formData.title); data.append('description', formData.description);
        data.append('type', formData.type); data.append('severity', formData.severity);
        data.append('latitude', position.lat); data.append('longitude', position.lng);
        // Append landmark if user typed one
        if (formData.landmark) data.append('landmark', formData.landmark);
        if (image) data.append('image', image);

        const toastId = toast.loading("Submitting report...");
        try {
            await API.post('/disasters', data, { headers: { 'Content-Type': 'multipart/form-data' }});
            toast.success("Report submitted! Waiting for admin approval.", { id: toastId });
            navigate('/my-reports');
        } catch (error) { toast.error(error.response?.data?.message || "Error submitting report", { id: toastId }); } 
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="container" style={{ maxWidth: '900px' }}>
            <div className="card card-custom p-4 shadow mb-4">
                <h2 className="mb-4 text-gradient-dark fw-bold text-center">Report an Emergency</h2>
                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6"><label className="form-label fw-bold">Title <span className="info-icon" title="Clear headline">ℹ</span></label><input className="form-control bg-light" required onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g. Road blocked by flood" /></div>
                        <div className="col-md-3"><label className="form-label fw-bold">Type</label><select className="form-select bg-light" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option>Flood</option><option>Earthquake</option><option>Cyclone</option><option>Fire</option><option>Landslide</option><option>Other</option></select></div>
                        <div className="col-md-3"><label className="form-label fw-bold">Severity</label><select className="form-select bg-light" value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div>
                    </div>
                    
                    <div className="mb-3 mt-3"><label className="form-label fw-bold">Description</label><textarea className="form-control bg-light" rows="3" required onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the situation..."></textarea></div>

                    <div className="row g-3">
                        <div className="col-md-6 mb-3"><label className="form-label fw-bold">Photo Evidence <span className="info-icon" title="Max 2MB">ℹ</span></label><input type="file" className="form-control bg-light" accept="image/jpeg, image/png" onChange={e => setImage(e.target.files[0])} /></div>
                        
                        {/* LANDMARK FIELD UI */}
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">Nearest Landmark <span className="text-muted fw-normal small">(Optional)</span></label>
                            <input type="text" className="form-control bg-light" onChange={e => setFormData({...formData, landmark: e.target.value})} placeholder="E.g. Near City Hospital or Main Station" />
                        </div>
                    </div>

                    <hr className="my-2" />

                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                        <label className="form-label fw-bold text-primary mb-0 fs-5">Location Selection</label>
                        <button type="button" className="btn btn-outline-danger fw-bold" onClick={handleGetLocation}>📍 Use My Current Location</button>
                    </div>

                    <div className="row g-3 mb-3 align-items-end">
                        <div className="col-md-5"><label className="form-label fw-bold text-secondary">Latitude</label><input type="text" className="form-control" value={latInput} onChange={e => setLatInput(e.target.value)} onBlur={handleCoordinateChange} /></div>
                        <div className="col-md-5"><label className="form-label fw-bold text-secondary">Longitude</label><input type="text" className="form-control" value={lngInput} onChange={e => setLngInput(e.target.value)} onBlur={handleCoordinateChange} /></div>
                        <div className="col-md-2"><button type="button" className="btn btn-secondary w-100 fw-bold" onClick={handleCoordinateChange}>Apply Pin</button></div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label text-muted small">You can also click anywhere on the map below.</label>
                        <div className="border rounded shadow-sm" style={{ height: '350px', width: '100%', overflow: 'hidden' }}>
                            <MapContainer center={center} zoom={4} minZoom={4} maxBounds={indiaBounds} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationPicker position={position} setPosition={setPosition} setLatInput={setLatInput} setLngInput={setLngInput} />
                                <MapCenterUpdater position={position} />
                            </MapContainer>
                        </div>
                    </div>
                    
                    <button type="submit" className="btn btn-gradient btn-lg w-100 mt-2" disabled={isSubmitting}>
                        {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                        {isSubmitting ? 'Submitting...' : 'Submit Emergency Report'}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default ReportDisaster;
