const mongoose = require('mongoose');

const disasterSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['Flood', 'Earthquake', 'Cyclone', 'Landslide', 'Fire', 'Storm', 'Drought', 'Other'], required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'ASSIGNED', 'RESOLVED'], default: 'PENDING' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    locationName: { type: String },
    image: { type: Buffer },
    imageContentType: { type: String },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: String },
    source: { type: String, enum: ['USER', 'USGS', 'GDACS'], default: 'USER' },
    externalId: { type: String, unique: true, sparse: true },
    
    // NEW FIELD: Admin Response Message
    adminMessage: { type: String } 
}, { timestamps: true });

module.exports = mongoose.model('DisasterReport', disasterSchema);
