import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import API from '../utils/api';

const HomeMap = () => {
    const [disasters, setDisasters] = useState([]);
    
    useEffect(() => {
        const fetchDisasters = async () => {
            try {
                const { data } = await API.get('/disasters');
                setDisasters(data.data);
            } catch (error) { console.error("Error fetching map data", error); }
        };
        fetchDisasters();
    }, []);

    // India Map Constraints
    const center = [22.9074872, 79.0669024]; // Center of India
    const indiaBounds = [
      [6.7535, 68.1623],  // South-West Boundary
      [35.5042, 97.3955]  // North-East Boundary
    ];

    return (
        <div className="container-fluid px-4">
            <h2 className="mb-3 text-gradient-dark fw-bold">Live Disaster Map (India)</h2>
            <div className="card card-custom p-2 shadow-sm" style={{ height: '80vh', width: '100%' }}>
                <MapContainer 
                    center={center} 
                    zoom={5} 
                    minZoom={5} 
                    maxBounds={indiaBounds} 
                    maxBoundsViscosity={1.0} // Locks the map firmly to the bounds
                    style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {disasters.map(d => (
                        <Marker key={d._id} position={[d.latitude, d.longitude]}>
                            <Popup>
                                <strong className="fs-6">{d.title}</strong><br/>
                                <b>Type:</b> {d.type}<br/> 
                                <b>Severity:</b> <span className={`text-${d.severity === 'CRITICAL' ? 'danger' : 'warning'}`}>{d.severity}</span><br/> 
                                <b>Source:</b> {d.source}<br/>
                                {d.source === 'USER' && (
                                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/disasters/${d._id}/image`} alt="Disaster" style={{ width: '100%', marginTop: '5px', borderRadius: '4px' }} onError={(e) => e.target.style.display = 'none'} />
                                )}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};
export default HomeMap;
