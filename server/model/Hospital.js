import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'
import jsonwebtoken from 'jsonwebtoken'
import crypto from 'crypto'

const HospitalSchema = new mongoose.Schema({
    hospitalId: {
        type: String,
        unique: [true, 'HOSPITAL ID ALREADY EXISTS'],
        required: [true, 'HOSPITAL ID REQUIRED']
    },
    name: {
        type: String
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    lat: {
        type: Number
    },
    lng: {
        type: Number
    },
    address: {
        type: String
    },
    country: {
        type: String,
        default: 'Nigeria'
    },
    accountType: {
        type: String,
        default: 'hospital'
    },
    profileImg: {
        type: String
    },
    email: {
        type: String,
        required: [true, 'EMAIL IS REQUIRED'],
        unique: [true, 'EMAIL ALREADY EXISTS'],
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'PASSWORD REQUIRED'],
    },
    phoneNumber:{
        type: String
    },
    location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [lng, lat]
          //index: '2dsphere' // Required for geo queries
        }
    },
    quickResponseMessage: {
        type: String,
    },

    verified: {
        type: Boolean,
        default: true
    },
    blocked: {
        type: Boolean,
        default: false
    },
    accountSuspended: {
        type: Boolean,
        default: false
    },
    noOfLoginAttempts: {
        type: Number,
        default: 0,
    },
    temporaryAccountBlockTime: {
        type: Date,
    },
    lastLogin: {
        type: Date,
    },
},
{ timestamps: true }
)

// Create 2dsphere index on the location field
HospitalSchema.index({ location: '2dsphere' });

HospitalSchema.pre('save', async function(next) {
    if(!this.isModified('password')){
        return next();
    }

    try {
        const salt = await bcryptjs.genSalt(10)
        this.password = await bcryptjs.hash(this.password, salt)
        next()
    } catch (error) {
        console.log('UNABLE TO HASH PASSWORD', error)
        next(error)
    }
})

HospitalSchema.methods.matchPassword = async function(password) {
    return await bcryptjs.compare(password, this.password)
}

HospitalSchema.methods.getAccessToken = function(){
    return jsonwebtoken.sign({ id: this.hospitalId, accountType: this?.accountType }, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE})
}

HospitalSchema.methods.getRefreshToken = function(){
    return jsonwebtoken.sign({ id: this.hospitalId, email: this.email, phoneNumber: this.phoneNumber }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE})
}

HospitalSchema.methods.getPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.resetPasswordExpire = Date.now() + 15 * ( 60 * 1000 )

    return resetToken
}

const HospitalModel = mongoose.model('hospital', HospitalSchema)
export default HospitalModel