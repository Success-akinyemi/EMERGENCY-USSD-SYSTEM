import mongoose from "mongoose";

const StateSchema = new mongoose.Schema({
    state: {
        type: String
    },
    slug: {
        type: String
    },
    active: {
        type: Boolean,
        default: true,
    },
    cities: [
        {
            city: {
                type: String
            },
            landmarks: [{
                place: {
                    type: String
                },
                lat: {
                    type: Number
                },
                lng: {
                    type: Number
                },
                location: {
                    type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point'
                    },
                    coordinates: {
                        type: [Number], // [lng, lat]
                    }
                }
            }]
        }
    ],
},
{ timestamps: true }
)

const StateModel = mongoose.model('state', StateSchema)
export default StateModel