import express from 'express'
import cors from 'cors';
import { config } from "dotenv";
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import http from 'http'; 
import { Server } from 'socket.io';
config()
import morgan from 'morgan';
import session from 'express-session';

const app = express()
const server = http.createServer(app); 
app.use(express.json())
//EXPRESS MIDDLEWARE
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

/**
 * 
app.use(session({
  secret: process.env.EXPRESS_SESSION_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
 */

//DB
import './connection/db.js';
//import './test.js';

const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL,
        process.env.ADMIN_URL,
        process.env.SERVER_URL,
        process.env.DEV_URL_ONE,
        process.env.DEV_URL_TWO,
    
        process.env.CLIENT_TWO_URL
      ],
      methods: ["GET", "POST"],
      credentials: true,
      transports: ["websocket"],
    },
  });

// CORS setup
const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    process.env.SERVER_URL,
    process.env.DEV_URL_ONE,
    process.env.DEV_URL_TWO,

    process.env.CLIENT_TWO_URL
];

const corsOptions = {
    origin: function (origin, callback) {
        console.log('URL ORIGIN', origin);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS', 'ORIGIN>', origin));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));
//for ios
/**
 * 
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', req.headers.origin); // echo origin
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});
 */

//app.options('/*', cors(corsOptions));


// Add Morgan middleware to log HTTP requests
app.use(morgan('dev'));


//app.post('/', (req, res) => {});

//ROUTES
import UssdRoutes from './routes/ussd.routes.js'
import HospitalAuthRoutes from './routes/hospital/hospitalAuth.routes.js'
import EmergencyUssdNotificationRoutes from './routes/emergencyUssdNotification.routes.js'
import AppointmentUssdNotificationRoutes from './routes/appointmentUssdNotification.routes.js'
import HospitalRoutes from './routes/hospital/hospital.routes.js'
import pushNotificationRoutes from './routes/pushNotification.routes.js'
import StatesRoutes from './routes/states.routes.js'


app.use('/', UssdRoutes)
app.use('/api/hospital/auth', HospitalAuthRoutes)
app.use('/api/hospital/emergency', EmergencyUssdNotificationRoutes)
app.use('/api/hospital/appointment', AppointmentUssdNotificationRoutes)
app.use('/api/hospital', HospitalRoutes)
app.use('/api/pushNotification', pushNotificationRoutes)
app.use('/api/state', StatesRoutes)





//SOCKET.IO
import { AuthenticateHospitalSocket } from './middlewares/auth/hospitalAuth.js';
// Namespaces
export const hospitalNamespace = io.of('/hospital');
export const patientNamespace = io.of('/patient');
export const adminNamespace = io.of('/admin');
export const generalNamespace = io.of('/general');

export const hospitalConnections = new Map()
export const patientConnections = new Map()
export const adminConnections = new Map()
export const generalConnections = new Map()


// Apply socket-specific authentication middleware for Driver
hospitalNamespace.use(AuthenticateHospitalSocket);
hospitalNamespace.on('connection', (socket) => {
  console.log('Hospital connected:', socket.id);

  const { hospitalId } = socket.user

  if(hospitalId){
    hospitalConnections.set(hospitalId, socket.id)
  }
  console.log('CONNECTING HOSPITAL ID TO SOCKET ID', hospitalConnections)

  //socket.on('updateLocation', (data) => hospital.updateLocation({ data, socket }));


  socket.on('disconnect', () => {
    console.log('Hospital disconnected:', socket.id);
    if(hospitalId){
        hospitalConnections.delete(hospitalId)
    }
  });
});

const PORT = 8080
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });