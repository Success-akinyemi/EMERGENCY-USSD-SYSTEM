import axios from "axios";
import useragent from "useragent";
import EmergencyUssdRequestModel from "../model/EmergencyUssdRequest.js";
import StateModel from "../model/States.js";
import { generateUniqueCode } from "../middlewares/utils.js";
import UssdNotificationModel from "../model/UssdNotification.js";
import HospitalModel from "../model/Hospital.js";
import { hospitalConnections, hospitalNamespace } from "../server.js";
import AppointmentUssdRequestModel from "../model/AppointmentUssdRequest.js";
import { sendCustomNotification } from "./pushNotification.controllers.js";

 const ITEMS_PER_PAGE = 8;
 const HOSPITAL_COVERAGE_RANGE = 100 //100km

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function parseTime(timeStr) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  
  return { hours, minutes };
}

function formatTime(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  minutes = minutes < 10 ? '0' + minutes : minutes;
  
  return `${hours}:${minutes} ${ampm}`;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

export async function ussd(req, res) {
    const { phoneNumber, text, sessionId, serviceCode } = req.body;
    const levels = text.trim().split('*');
    const responseLines = [];
    console.log('USSD Access:', text);

    const notificationType = ['Emergency Alert', 'Book Appointment', 'Check Appointment', 'Cancel Appointment'];
    const accidentTypes = ['Snake bite', 'Road Accident', 'Fire Accident', 'Water Accident', 'Others'];
    const allStates = await StateModel.find({ active: true }).select('state cities').lean();
    const stateNames = allStates.map(s => s.state);

    const getPaged = (list, page) => 
        list.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // Step 0: Initial menu
    if(text === '') {
        responseLines.push('CON Welcome to DMS medical solutions.\nSelect your option:');
        notificationType.forEach((t, i) => responseLines.push(`${i + 1}. ${t}`));
    }

    // EMERGENCY ALERT FLOW
    else if (levels[0] === '1') {
        const accidentTypes = ['Snake bite', 'Road Accident', 'Fire Accident', 'Water Accident', 'Others'];
        const allStates = await StateModel.find({ active: true }).select('state cities').lean();
        const stateNames = allStates.map(s => s.state);
        const getPaged = (list, page) => list.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

        let pointer = 1;

        // STEP 1: Ask for accident type
        if (!levels[1]) {
            responseLines.push('CON Select type of emergency:');
            accidentTypes.forEach((type, i) => responseLines.push(`${i + 1}. ${type}`));
            return res.send(responseLines.join('\n'));
        }

        const accidentIndex = parseInt(levels[pointer++]) - 1;
        if (isNaN(accidentIndex) || accidentIndex < 0 || accidentIndex >= accidentTypes.length)
            return res.send('END Invalid emergency selection');

        // STEP 2: Ask for state (paginated)
        let statePage = 1;
        while (levels[pointer] === '9') {
            statePage++;
            pointer++;
        }

        if (!levels[pointer]) {
            const totalPages = Math.ceil(stateNames.length / ITEMS_PER_PAGE);
            if (statePage > totalPages) return res.send('END Invalid state page');

            responseLines.push(`CON Select your state (Page ${statePage} of ${totalPages}):`);
            getPaged(stateNames, statePage).forEach((state, i) =>
                responseLines.push(`${i + 1}. ${state}`));
            if (statePage < totalPages) responseLines.push('9. More');
            return res.send(responseLines.join('\n'));
        }

        const stateIndex = (statePage - 1) * ITEMS_PER_PAGE + parseInt(levels[pointer++]) - 1;
        if (stateIndex < 0 || stateIndex >= allStates.length)
            return res.send('END Invalid state selection');

        const selectedState = allStates[stateIndex];

        // STEP 3: Ask for city (paginated)
        let cityPage = 1;
        while (levels[pointer] === '9') {
            cityPage++;
            pointer++;
        }

        if (!levels[pointer]) {
            const totalPages = Math.ceil(selectedState.cities.length / ITEMS_PER_PAGE);
            if (cityPage > totalPages) return res.send('END Invalid city page');

            responseLines.push(`CON ${selectedState.state}: Select city (Page ${cityPage} of ${totalPages}):`);
            getPaged(selectedState.cities, cityPage).forEach((city, i) =>
                responseLines.push(`${i + 1}. ${city.city}`));
            if (cityPage < totalPages) responseLines.push('9. More');
            return res.send(responseLines.join('\n'));
        }

        const cityIndex = (cityPage - 1) * ITEMS_PER_PAGE + parseInt(levels[pointer++]) - 1;
        if (cityIndex < 0 || cityIndex >= selectedState.cities.length)
            return res.send('END Invalid city selection');

        const selectedCity = selectedState.cities[cityIndex];

        // STEP 4: Ask for landmark (paginated)
        let landmarkPage = 1;
        while (levels[pointer] === '9') {
            landmarkPage++;
            pointer++;
        }

        if (!levels[pointer]) {
            const totalPages = Math.ceil(selectedCity.landmarks.length / ITEMS_PER_PAGE);
            if (landmarkPage > totalPages) return res.send('END Invalid landmark page');

            responseLines.push(`CON ${selectedCity.city}: Select landmark (Page ${landmarkPage} of ${totalPages}):`);
            getPaged(selectedCity.landmarks, landmarkPage).forEach((landmark, i) =>
                responseLines.push(`${i + 1}. ${landmark.place}`));
            if (landmarkPage < totalPages) responseLines.push('9. More');
            return res.send(responseLines.join('\n'));
        }

        const landmarkIndex = (landmarkPage - 1) * ITEMS_PER_PAGE + parseInt(levels[pointer]) - 1;
        if (landmarkIndex < 0 || landmarkIndex >= selectedCity.landmarks.length)
            return res.send('END Invalid landmark selection');

        const selectedLandmark = selectedCity.landmarks[landmarkIndex];

        // FINAL STEP: Save emergency request
        const ussdRequestId = await generateUniqueCode(9);
        const ussdRequest = await EmergencyUssdRequestModel.create({
            ussdRequestId,
            phoneNumber,
            notificationType: `Emergency`,
            message: `Emergency: ${accidentTypes[accidentIndex]} at ${selectedLandmark.place}, ${selectedCity.city}, ${selectedState.state}`,
            sessionId,
            selectedAccident: accidentTypes[accidentIndex],
            selectedPlace: selectedLandmark.place,
            city: selectedCity.city,
            state: selectedState.state,
            lat: selectedLandmark.lat,
            lng: selectedLandmark.lng,
            serviceCode,
            text
        });

        responseLines.push(
            `END Emergency reported successfully!\n` +
            `Type: ${accidentTypes[accidentIndex]}\n` +
            `Location: ${selectedLandmark.place}\n` +
            `City: ${selectedCity.city}\n` +
            `State: ${selectedState.state}\n` +
            `Coordinates: ${selectedLandmark.lat},${selectedLandmark.lng}`
        );

        setImmediate(() => notifyNearbyHospitals(ussdRequest));
        return res.send(responseLines.join('\n'));
    }

        
    // BOOK APPOINTMENT (Add your implementation here)
    else if (levels[0] === '2') {
        const consultationIssues = [
            'Fever, cough, chest pain', 
            'Ear/eye problem', 
            'Injury/bleeding', 
            'Pregnancy/baby issue', 
            'I am not sure'
        ];

        const capitalizeFirstLetter = (string) => 
            string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

        const getPageNumber = (arr) => arr.filter(item => item === '9').length + 1;

        // Step 1: Show states (initial)
        if (levels.length === 1) {
            const statesAgg = await HospitalModel.aggregate([
                { 
                    $group: { 
                        _id: { $toLower: { $trim: { input: "$state" } } }, 
                        state: { $first: { $trim: { input: "$state" } } }
                    }
                },
                { $sort: { state: 1 } }
            ]);
            
            const states = statesAgg.map(s => s.state);
            const page = 1;
            const pagedStates = states.slice(0, ITEMS_PER_PAGE);
            
            responseLines.push(`CON Select your state (Page ${page}/${Math.ceil(states.length/ITEMS_PER_PAGE)}):`);
            pagedStates.forEach((s, i) => responseLines.push(`${i+1}. ${capitalizeFirstLetter(s)}`));
            if (states.length > ITEMS_PER_PAGE) responseLines.push('9. More');
        }

        // Step 2: State pagination or selection
        else if (levels.length === 2) {
            const input = levels[1];
            
            // State pagination
            if (input === '9') {
                const page = getPageNumber([input]);
                const statesAgg = await HospitalModel.aggregate([
                    { 
                        $group: { 
                            _id: { $toLower: { $trim: { input: "$state" } } }, 
                            state: { $first: { $trim: { input: "$state" } } }
                        }
                    },
                    { $sort: { state: 1 } }
                ]);
                
                const states = statesAgg.map(s => s.state);
                const pagedStates = states.slice(
                    (page-1)*ITEMS_PER_PAGE, 
                    page*ITEMS_PER_PAGE
                );
                
                responseLines.push(`CON Select state (Page ${page}/${Math.ceil(states.length/ITEMS_PER_PAGE)}):`);
                pagedStates.forEach((s, i) => responseLines.push(`${i+1}. ${capitalizeFirstLetter(s)}`));
                if (states.length > page*ITEMS_PER_PAGE) responseLines.push('9. More');
            }
            // State selected
            else {
                const stateIndex = parseInt(input) - 1;
                const statesAgg = await HospitalModel.aggregate([
                    { 
                        $group: { 
                            _id: { $toLower: { $trim: { input: "$state" } } }, 
                            state: { $first: { $trim: { input: "$state" } } }
                        }
                    },
                    { $sort: { state: 1 } }
                ]);
                
                if (stateIndex < 0 || stateIndex >= statesAgg.length) 
                    return res.send('END Invalid state selection');
                
                const selectedState = statesAgg[stateIndex].state;
                const citiesAgg = await HospitalModel.aggregate([
                    { $match: { state: new RegExp(`^\\s*${selectedState}\\s*$`, 'i') } },
                    { 
                        $group: { 
                            _id: { $toLower: { $trim: { input: "$city" } } }, 
                            city: { $first: { $trim: { input: "$city" } } }
                        }
                    },
                    { $sort: { city: 1 } }
                ]);
                
                const cities = citiesAgg.map(c => c.city);
                const page = 1;
                const pagedCities = cities.slice(0, ITEMS_PER_PAGE);
                
                responseLines.push(`CON Select city in ${capitalizeFirstLetter(selectedState)} (Page ${page}/${Math.ceil(cities.length/ITEMS_PER_PAGE)}):`);
                pagedCities.forEach((c, i) => responseLines.push(`${i+1}. ${capitalizeFirstLetter(c)}`));
                if (cities.length > ITEMS_PER_PAGE) responseLines.push('9. More');
            }
        }

        // Step 3: City pagination or selection
        else if (levels.length === 3) {
            const [_, stateInput, cityInput] = levels;
            const stateIndex = parseInt(stateInput) - 1;
            
            // City pagination
            if (cityInput === '9') {
                const page = getPageNumber([cityInput]);
                const statesAgg = await HospitalModel.aggregate([
                    { 
                        $group: { 
                            _id: { $toLower: { $trim: { input: "$state" } } }, 
                            state: { $first: { $trim: { input: "$state" } } }
                        }
                    },
                    { $sort: { state: 1 } }
                ]);
                
                const selectedState = statesAgg[stateIndex].state;
                const citiesAgg = await HospitalModel.aggregate([
                    { $match: { state: new RegExp(`^\\s*${selectedState}\\s*$`, 'i') } },
                    { 
                        $group: { 
                            _id: { $toLower: { $trim: { input: "$city" } } }, 
                            city: { $first: { $trim: { input: "$city" } } }
                        }
                    },
                    { $sort: { city: 1 } }
                ]);
                
                const cities = citiesAgg.map(c => c.city);
                const pagedCities = cities.slice(
                    (page-1)*ITEMS_PER_PAGE, 
                    page*ITEMS_PER_PAGE
                );
                
                responseLines.push(`CON Select city in ${capitalizeFirstLetter(selectedState)} (Page ${page}/${Math.ceil(cities.length/ITEMS_PER_PAGE)}):`);
                pagedCities.forEach((c, i) => responseLines.push(`${i+1}. ${capitalizeFirstLetter(c)}`));
                if (cities.length > page*ITEMS_PER_PAGE) responseLines.push('9. More');
            }
            // City selected - show issues
            else {
                responseLines.push('CON Select consultation issue:');
                consultationIssues.forEach((issue, i) => 
                    responseLines.push(`${i+1}. ${issue}`));
            }
        }

        // Step 4: Consultation issue selected - show hospitals
        else if (levels.length === 4) {
            const [_, stateInput, cityInput, issueInput] = levels;
            const stateIndex = parseInt(stateInput) - 1;
            const cityIndex = parseInt(cityInput) - 1;
            
            // Validate issue selection
            if (isNaN(issueInput)) return res.send('END Invalid issue selection');
            const issueIndex = parseInt(issueInput) - 1;
            if (issueIndex < 0 || issueIndex >= consultationIssues.length) 
                return res.send('END Invalid issue selection');

            // Get location details
            const statesAgg = await HospitalModel.aggregate([
                { 
                    $group: { 
                        _id: { $toLower: { $trim: { input: "$state" } } }, 
                        state: { $first: { $trim: { input: "$state" } } }
                    }
                },
                { $sort: { state: 1 } }
            ]);
            const selectedState = statesAgg[stateIndex].state;
            
            const citiesAgg = await HospitalModel.aggregate([
                { $match: { state: new RegExp(`^\\s*${selectedState}\\s*$`, 'i') } },
                { 
                    $group: { 
                        _id: { $toLower: { $trim: { input: "$city" } } }, 
                        city: { $first: { $trim: { input: "$city" } } }
                    }
                },
                { $sort: { city: 1 } }
            ]);
            const selectedCity = citiesAgg[cityIndex].city;

            // Find base hospital for geoquery
            const baseHospital = await HospitalModel.findOne({
                state: new RegExp(`^\\s*${selectedState}\\s*$`, 'i'),
                city: new RegExp(`^\\s*${selectedCity}\\s*$`, 'i')
            }).select('location').lean();
            if (!baseHospital) {
                return res.send('END No reference hospital found in selected area');
            }
            console.log('baseHospital', 'baseHospital', baseHospital)

            // Find nearby hospitals
            const hospitals = await HospitalModel.find({
            location: {
                $near: {
                $geometry: baseHospital.location,
                $maxDistance: 30000  // 30 kilometers
                }
            },
            state: new RegExp(`^\\s*${selectedState}\\s*$`, 'i'),
            city: new RegExp(`^\\s*${selectedCity}\\s*$`, 'i')
            }).select('name hospitalId');

            responseLines.push(`CON Select hospital (${hospitals.length} found):`);
            hospitals.slice(0, ITEMS_PER_PAGE).forEach((h, i) => 
                responseLines.push(`${i+1}. ${h.name}`));
            if (hospitals.length > ITEMS_PER_PAGE) responseLines.push('9. More');
        }

        // Step 5: Hospital selected - show available days
        else if (levels.length === 5) {
            const [_, stateInput, cityInput, issueInput, hospitalInput] = levels;
            const stateIndex = parseInt(stateInput) - 1;
            const cityIndex = parseInt(cityInput) - 1;
            const hospitalIndex = parseInt(hospitalInput) - 1;
            
            // Validate selections
            const issueIndex = parseInt(issueInput) - 1;
            if (issueIndex < 0 || issueIndex >= consultationIssues.length)
            return res.send('END Invalid issue selection');

            // Get state and city
            const statesAgg = await HospitalModel.aggregate([
                { 
                    $group: { 
                        _id: { $toLower: { $trim: { input: "$state" } } }, 
                        state: { $first: { $trim: { input: "$state" } } }
                    }
                },
                { $sort: { state: 1 } }
            ]);
            const selectedState = statesAgg[stateIndex].state;
            
            const citiesAgg = await HospitalModel.aggregate([
                { $match: { state: new RegExp(`^\\s*${selectedState}\\s*$`, 'i') } },
                { 
                    $group: { 
                        _id: { $toLower: { $trim: { input: "$city" } } }, 
                        city: { $first: { $trim: { input: "$city" } } }
                    }
                },
                { $sort: { city: 1 } }
            ]);
            const selectedCity = citiesAgg[cityIndex].city;

            // Get hospital
            const baseHospital = await HospitalModel.findOne({
                state: new RegExp(`^\\s*${selectedState}\\s*$`, 'i'),
                city: new RegExp(`^\\s*${selectedCity}\\s*$`, 'i')
            }).select('location').lean();
            if (!baseHospital) {
            return res.send('END No reference hospital found in selected area');
            }

            // Find nearby hospitals
            const hospitals = await HospitalModel.find({
            location: {
                $near: {
                $geometry: baseHospital.location,
                $maxDistance: 30000  // 30 kilometers
                }
            },
            state: new RegExp(`^\\s*${selectedState}\\s*$`, 'i'),
            city: new RegExp(`^\\s*${selectedCity}\\s*$`, 'i')
            }).select('name hospitalId email openingDays openingHours closingHours nextAvailablePeriod');
            
            if (hospitalIndex < 0 || hospitalIndex >= hospitals.length)
            return res.send('END Invalid hospital selection');

            const selectedHospital = hospitals[hospitalIndex];

            // Generate available days
            const now = new Date();
            const days = [];
            let currentDate = new Date(now);
            
            // Check if we should skip today
            const { hours: closingHour, minutes: closingMinute } = parseTime(selectedHospital.closingHours);
            const closingTime = new Date(now);
            closingTime.setHours(closingHour, closingMinute, 0, 0);
            
            if (now > closingTime) {
            currentDate.setDate(currentDate.getDate() + 1);
            }

            // Get next 5 opening days
            for (let i = 0; i < 7 && days.length < 5; i++) {
            const dayName = getDayName(currentDate);
            
            if (selectedHospital.openingDays.includes(dayName)) {
                days.push({
                name: dayName,
                date: new Date(currentDate)
                });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
            }

            // Save hospital ID temporarily for next step
            const ussdRequestId = await generateUniqueCode(9);
            const tempRequest = await AppointmentUssdRequestModel.create({
                ussdRequestId: `${ussdRequestId}TEMPREQ`, 
                phoneNumber,
                sessionId: `${sessionId}TEMPREQ`,
                hospitalId: selectedHospital.hospitalId,
                issue: consultationIssues[issueIndex],
                state: selectedState,
                city: selectedCity
            });

            responseLines.push('CON Select appointment day:');
            days.forEach((day, i) => {
            const dateStr = day.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
            });
            responseLines.push(`${i+1}. ${dateStr}`);
            });
        }

          // Step 6: Day selection and time assignment
        else if (levels.length === 6) {
            const dayIndex = parseInt(levels[5]) - 1;
            
            // Get temporary request data
            const tempRequest = await AppointmentUssdRequestModel.findOne({ sessionId: `${sessionId}TEMPREQ` })
            .sort({ createdAt: -1 });
            
            if (!tempRequest) {
            return res.send('END Session expired. Please start over.');
            }

            // Get hospital
            const hospital = await HospitalModel.findOne({ hospitalId: tempRequest.hospitalId });
            if (!hospital) {
            return res.send('END Hospital not found');
            }

            // Reconstruct available days (same as in step 5)
            const now = new Date();
            const days = [];
            let currentDate = new Date(now);
            
            const { hours: closureHour, minutes: closuregMinute } = parseTime(hospital.closingHours);
            const closingTime = new Date(now);
            closingTime.setHours(closureHour, closuregMinute, 0, 0);
            
            if (now > closingTime) {
            currentDate.setDate(currentDate.getDate() + 1);
            }

            for (let i = 0; i < 7 && days.length < 5; i++) {
            const dayName = getDayName(currentDate);
            
            if (hospital.openingDays.includes(dayName)) {
                days.push({
                name: dayName,
                date: new Date(currentDate)
                });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
            }

            if (dayIndex < 0 || dayIndex >= days.length) {
            return res.send('END Invalid day selection');
            }

            const selectedDay = days[dayIndex];
            const dayName = selectedDay.name;
            const appointmentDate = selectedDay.date;

            // Find or create availability slot
            let slot = hospital.nextAvailablePeriod.find(
            s => s.day === dayName
            );

            // Initialize slot if not exists or outdated
            if (!slot || new Date(slot.date) < new Date()) {
            const { hours, minutes } = parseTime(hospital.openingHours);
            appointmentDate.setHours(hours, minutes, 0, 0);
            
            slot = {
                day: dayName,
                nextAvailabletime: hospital.openingHours,
                date: appointmentDate
            };
            
            hospital.nextAvailablePeriod.push(slot);
            }

            // Calculate appointment time
            let appointmentTime = new Date(slot.date);
            const [time, modifier] = slot.nextAvailabletime.split(' ');
            const [hoursStr, minutesStr] = time.split(':');
            appointmentTime.setHours(
            parseInt(hoursStr) + (modifier === 'PM' && hoursStr < 12 ? 12 : 0),
            parseInt(minutesStr)
            );

            // Adjust for today's appointments
            if (isSameDay(appointmentDate, new Date())) {
            const twentyMinsLater = new Date(now.getTime() + 20 * 60000);
            
            if (appointmentTime < twentyMinsLater) {
                // Round up to next 30-minute slot
                const minutes = twentyMinsLater.getMinutes();
                const roundUp = minutes > 30 ? 60 : 30;
                appointmentTime = new Date(twentyMinsLater);
                appointmentTime.setMinutes(roundUp, 0, 0);
            }
            }

            // Check if exceeds closing time
            const closingDateTime = new Date(appointmentDate);
            const { hours: closingHour, minutes: closingMinute } = parseTime(hospital.closingHours);
            closingDateTime.setHours(closingHour, closingMinute, 0, 0);
            
            const appointmentEndTime = addMinutes(appointmentTime, 30);
            
            if (appointmentEndTime > closingDateTime) {
            // Move to next day
            const nextDay = new Date(appointmentDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            // Find next opening day
            while (!hospital.openingDays.includes(getDayName(nextDay))) {
                nextDay.setDate(nextDay.getDate() + 1);
            }
            
            appointmentDate.setDate(nextDay.getDate());
            appointmentDate.setMonth(nextDay.getMonth());
            appointmentDate.setFullYear(nextDay.getFullYear());
            
            const { hours, minutes } = parseTime(hospital.openingHours);
            appointmentDate.setHours(hours, minutes, 0, 0);
            appointmentTime = new Date(appointmentDate);
            
            // Update slot
            slot.day = getDayName(nextDay);
            slot.date = appointmentDate;
            slot.nextAvailabletime = hospital.openingHours;
            }

            // Update next available time
            const nextSlotTime = addMinutes(appointmentTime, 30);
            slot.nextAvailabletime = formatTime(nextSlotTime);
            slot.date = appointmentDate;
            
            // Save hospital updates
            await hospital.save();

            // Format date/time for display
            const formattedDate = appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
            });
            const formattedTime = formatTime(appointmentTime);

            // Create final appointment
            const ussdRequestId = await generateUniqueCode(9);
            const ussdRequest = await AppointmentUssdRequestModel.create({
            ussdRequestId,
            phoneNumber,
            message: `Appointment: ${tempRequest.issue}`,
            sessionId,
            notificationType: 'Appointment',
            state: tempRequest.state,
            city: tempRequest.city,
            issue: tempRequest.issue,
            hospitalId: hospital.hospitalId,
            date: appointmentDate,
            time: formattedTime
            });

            await sendCustomNotification({
                title: `New Appointment`,
                message: `Appointment: Issues: ${tempRequest.issue}`,
                email: `${hospital.email}`
            })

            await UssdNotificationModel.create({
                hospitalId: hospital.hospitalId,
                ussdRequestId,
                notificationId: await generateUniqueCode(9)
            })

            responseLines.push(
            `END Appointment confirmed!\n` +
            `State: ${tempRequest.state}\n` +
            `City: ${tempRequest.city}\n` +
            `Issue: ${tempRequest.issue}\n` +
            `Hospital: ${hospital.name}\n` +
            `Date: ${formattedDate} at ${formattedTime}\n` +
            `Request ID: ${ussdRequestId}`
            );
            
            // Clean up temp request
            await AppointmentUssdRequestModel.deleteOne({ _id: tempRequest._id });
        }
    }


    res.set('Content-Type', 'text/plain');
    res.send(responseLines.join('\n'));
}




/**
 * 
async function notifyNearbyHospitals(ussdRequest) {
    const { lat, lng, ussdRequestId } = ussdRequest;

    // 100 km radius, convert to radians (approx 6371km Earth radius)
    const radiusInRadians = HOSPITAL_COVERAGE_RANGE / 6371;

    const hospitals = await HospitalModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radiusInRadians]
            }
        }
    }).select('_id hospitalId');
    
    console.log('hospitals123', hospitals)

    if (!hospitals.length) return;

    //const notificationId = await generateUniqueCode(9);

    const notifications = await Promise.all(hospitals.map(async h => ({
        hospitalId: h.hospitalId,
        ussdRequestId,
        notificationId: await generateUniqueCode(9)
    })));
    
    console.log('NOTIFICATION', notifications)
    await UssdNotificationModel.insertMany(notifications);
}
 */
 
async function notifyNearbyHospitals(ussdRequest) {
    const { lat, lng, ussdRequestId } = ussdRequest;

    // 100 km radius (converted to radians)
    const radiusInRadians = HOSPITAL_COVERAGE_RANGE / 6371;

    const hospitals = await HospitalModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radiusInRadians]
            }
        }
    }).select('_id hospitalId email');

    if (!hospitals.length) return;

    const notifications = await Promise.all(hospitals.map(async h => ({
        hospitalId: h.hospitalId,
        ussdRequestId,
        notificationId: await generateUniqueCode(9)
    })));

    await Promise.all(hospitals.map(h =>
        sendCustomNotification({
            title: `New Emergency`,
            email: h.email,
            message: ussdRequest.message
        })
    ));

    await UssdNotificationModel.insertMany(notifications);

    // Prepare socket emit payload
    const realTimePayloads = notifications.map(n => {
        return {
            hospitalId: n.hospitalId,
            notification: n,
            request: {
                ussdRequestId: ussdRequest.ussdRequestId,
                message: ussdRequest.message,
                phoneNumber: ussdRequest.phoneNumber,
                selectedAccident: ussdRequest.selectedAccident,
                selectedPlace: ussdRequest.selectedPlace,
                city: ussdRequest.city,
                state: ussdRequest.state,
                lat: ussdRequest.lat,
                lng: ussdRequest.lng,
                createdAt: ussdRequest.createdAt
            }
        };
    });

    // Emit to connected hospitals
    for (const payload of realTimePayloads) {
        const socketId = hospitalConnections.get(payload.hospitalId);
        if (socketId && hospitalNamespace.sockets.get(socketId)) {
            hospitalNamespace.to(socketId).emit('newUssdEmergency', { success: true, data: payload});
        }
    }
}



   // Helper function to calculate selected index
   function getSelectedIndex(levels, maxLength) {
       let page = 1;
       let index = 0;
       
       for (const level of levels) {
           if (level === '9') {
               page++;
           } else {
               index = (page - 1) * ITEMS_PER_PAGE + parseInt(level) - 1;
           }
       }
       
       return index >= maxLength ? -1 : index;
   }



  
  
  