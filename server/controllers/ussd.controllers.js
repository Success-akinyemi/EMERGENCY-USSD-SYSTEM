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

/**
 * 
 * 
export async function ussd(req, res) {
        // Extract device information
        const agent = useragent.parse(req.headers['user-agent']);
        const deviceInfo = agent.toString(); // e.g., "Chrome 110.0.0 on Windows 10"
        const deviceType = agent.device?.family || 'Unknown Device';
    
        // Get user IP
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
    
        // Fetch location details
        let locationInfo = 'Unknown';
        try {
            const { data } = await axios.get(`https://ipinfo.io/${ip}/json`);
            locationInfo = `${data.city}, ${data.region}, ${data.country}`;
        } catch (err) {
            console.log('Error fetching location:', err.message);
        }
        console.log('USSD Access:', {
            'IP': ip,
            'locationInfo': locationInfo,
            'deviceType': deviceType,
            'deviceInfo': deviceInfo
        });
        // Read the variables sent via POST from our API
        const {
            sessionId,
            serviceCode,
            phoneNumber,
            text,
        } = req.body;
    
        let response = '';
    
        if (text == '') {
            // This is the first request. Note how we start the response with CON
            response = `CON What would you like to check
            1. My account
            2. My phone number`;
        } else if ( text == '1') {
            // Business logic for first level response
            response = `CON Choose account information you want to view
            1. Account number`;
        } else if ( text == '2') {
            // Business logic for first level response
            // This is a terminal request. Note how we start the response with END
            response = `END Your phone number is ${phoneNumber}`;
        } else if ( text == '1*1') {
            // This is a second level response where the user selected 1 in the first instance
            const accountNumber = 'ACC100101';
            // This is a terminal request. Note how we start the response with END
            response = `END Your account number is ${accountNumber}`;
        }
    
        // Send the response back to the API
        res.set('Content-Type: text/plain');
        res.send(response);   
}
 */

/**
 * 
const states = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
    'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
    'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
    'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];
 */

/**
 const lgas = {
   Abia: ['Aba',],
   Lagos: ['Ikeja', 'Lekki', 'Epe', 'Yaba', 'Ikorodu'],
   Abuja: ['Garki', 'Wuse', 'Maitama', 'Asokoro', 'Nyanya'],
   Kano: ['Nassarawa', 'Dala', 'Gwale', 'Fagge', 'Kumbotso']
   // Add more...
 };
 * 
 */

 const ITEMS_PER_PAGE = 8;
 const HOSPITAL_COVERAGE_RANGE = 100 //100km

 /**
  export async function ussd(req, res) {
     const { phoneNumber, text, sessionId, serviceCode } = req.body;
     const levels = text.trim().split('*');
     const responseLines = [];
   
     const accidentTypes = ['Snake bite', 'Road Accident', 'Fire Accident', 'Water Accident', 'Others'];
     const allStates = await StateModel.find({}).select('state cities').lean();
     const stateNames = allStates.map(s => s.state);
   
   
     // Get the number of total pages based on the stateNames array
     const totalPages = Math.ceil(stateNames.length / ITEMS_PER_PAGE);
   
     // Function to render a specific page of states
     const renderStatesPage = (page) => {
       const pagedStates = getPaged(stateNames, page);
       responseLines.push(`CON Select your state (Page ${page} of ${totalPages}):`);
       pagedStates.forEach((state, i) => responseLines.push(`${i + 1}. ${state}`));
       if (page < totalPages) {
         responseLines.push(`${ITEMS_PER_PAGE + 1}. More`);
       }
     };
   
     // Function to get paginated list
     const getPaged = (list, page) => list.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
   
     // Step 0: Welcome
     if (text === '') {
       responseLines.push('CON Welcome to DMS medical solutions.\nSelect type of emergency:');
       accidentTypes.forEach((t, i) => responseLines.push(`${i + 1}. ${t}`));
     }
   
     // Step 1: Select Emergency Type
     else if (levels.length === 1) {
       const accidentIndex = parseInt(levels[0]) - 1;
       if (accidentIndex < 0 || accidentIndex >= accidentTypes.length)
         return res.send('END Invalid emergency type selected.');
   
       // Start with the first page of states
       renderStatesPage(1);
     }
   
     // Step 2: Select State (with pagination)
     else if (levels.length >= 2 && levels.length < 4) {
       const accidentIndex = parseInt(levels[0]) - 1;
       if (accidentIndex < 0 || accidentIndex >= accidentTypes.length)
         return res.send('END Invalid accident type.');
   
       const pageClicks = levels.slice(1).filter(l => l === `${ITEMS_PER_PAGE + 1}`).length;
       const page = pageClicks + 1;
       const lastInput = parseInt(levels[levels.length - 1]);
   
       // User wants more states
       if (lastInput === ITEMS_PER_PAGE + 1 || isNaN(lastInput)) {
         if (page < totalPages) {
           renderStatesPage(page + 1);
         } else {
           renderStatesPage(page);
         }
       } else {
         const stateIndex = (page - 1) * ITEMS_PER_PAGE + lastInput - 1;
         const selectedState = allStates[stateIndex];
         if (!selectedState) return res.send('END Invalid state selected.');
   
         const pagedCities = getPaged(selectedState.cities, 1);
         responseLines.push(`CON ${selectedState.state}: Select your city (Page 1):`);
         pagedCities.forEach((city, i) => responseLines.push(`${i + 1}. ${city.city}`));
         if (selectedState.cities.length > ITEMS_PER_PAGE) responseLines.push(`${ITEMS_PER_PAGE + 1}. More`);
       }
     }
   
     // Step 3: Select City (with pagination)
     else if (levels.length >= 4 && levels.length < 6) {
       const accidentIndex = parseInt(levels[0]) - 1;
       const statePageClicks = levels.slice(1, 3).filter(l => l === `${ITEMS_PER_PAGE + 1}`).length;
       const statePage = statePageClicks + 1;
       const stateSelection = parseInt(levels[statePageClicks + 1]) - 1;
       const stateIndex = (statePage - 1) * ITEMS_PER_PAGE + stateSelection;
       const selectedState = allStates[stateIndex];
       if (!selectedState) return res.send('END Invalid state selected.');
   
       const cityClicks = levels.slice(3).filter(l => l === `${ITEMS_PER_PAGE + 1}`).length;
       const cityPage = cityClicks + 1;
       const lastInput = parseInt(levels[levels.length - 1]);
   
       if (lastInput === ITEMS_PER_PAGE + 1) {
         const nextCities = getPaged(selectedState.cities, cityPage + 1);
         responseLines.push(`CON ${selectedState.state}: Select your city (Page ${cityPage + 1}):`);
         nextCities.forEach((c, i) => responseLines.push(`${i + 1}. ${c.city}`));
         if (selectedState.cities.length > (cityPage + 1) * ITEMS_PER_PAGE)
           responseLines.push(`${ITEMS_PER_PAGE + 1}. More`);
       } else {
         const cityIndex = (cityPage - 1) * ITEMS_PER_PAGE + lastInput - 1;
         const selectedCity = selectedState.cities[cityIndex];
         if (!selectedCity) return res.send('END Invalid city selected.');
   
         const pagedLandmarks = getPaged(selectedCity.landmarks, 1);
         responseLines.push(`CON ${selectedCity.city}: Select a landmark (Page 1):`);
         pagedLandmarks.forEach((lm, i) => responseLines.push(`${i + 1}. ${lm.place}`));
         if (selectedCity.landmarks.length > ITEMS_PER_PAGE) responseLines.push(`${ITEMS_PER_PAGE + 1}. More`);
       }
     }
   
     // Step 4: Landmark Selection
     else {
       try {
         const accidentIndex = parseInt(levels[0]) - 1;
         const statePageClicks = levels.slice(1, 3).filter(l => l === `${ITEMS_PER_PAGE + 1}`).length;
         const statePage = statePageClicks + 1;
         const stateSelection = parseInt(levels[statePageClicks + 1]) - 1;
         const stateIndex = (statePage - 1) * ITEMS_PER_PAGE + stateSelection;
         const selectedState = allStates[stateIndex];
         if (!selectedState) return res.send('END Invalid state.');
   
         const cityClicks = levels.slice(3, 5).filter(l => l === `${ITEMS_PER_PAGE + 1}`).length;
         const cityPage = cityClicks + 1;
         const citySelection = parseInt(levels[cityClicks + 3]) - 1;
         const cityIndex = (cityPage - 1) * ITEMS_PER_PAGE + citySelection;
         const selectedCity = selectedState.cities[cityIndex];
         if (!selectedCity) return res.send('END Invalid city.');
   
         const landmarkClicks = levels.slice(5).filter(l => l === `${ITEMS_PER_PAGE + 1}`).length;
         const landmarkPage = landmarkClicks + 1;
         const landmarkSelection = parseInt(levels[levels.length - 1]) - 1;
         const landmarkIndex = (landmarkPage - 1) * ITEMS_PER_PAGE + landmarkSelection;
         const selectedLandmark = selectedCity.landmarks[landmarkIndex];
         if (!selectedLandmark) return res.send('END Invalid landmark.');
   
         responseLines.push(`END Dear user, your accident "${accidentTypes[accidentIndex]}" has been received.`);
         responseLines.push(`Location: ${selectedLandmark.place}, ${selectedCity.city}, ${selectedState.state}.`);
         responseLines.push(`Latitude: ${selectedLandmark.lat}, Longitude: ${selectedLandmark.lng}`);
         responseLines.push(`An SMS will be sent shortly.`);
   
         await UssdRequestModel.create({
           phoneNumber,
           message: `Dear user, your accident "${accidentTypes[accidentIndex]}" at ${selectedLandmark.place}, ${selectedCity.city}, ${selectedState.state} has been recorded. (lat: ${selectedLandmark.lat}, lng: ${selectedLandmark.lng})`,
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
       } catch (err) {
         return res.send('END Something went wrong.');
       }
     }
   
     res.set('Content-Type', 'text/plain');
     res.send(responseLines.join('\n'));
   }
  */

  
   /**
    * 
   
   export async function ussd(req, res) {
       const { phoneNumber, text, sessionId, serviceCode } = req.body;
       const levels = text.trim().split('*');
       const responseLines = [];
       console.log('USSD Access:',text)
   
       const accidentTypes = ['Snake bite', 'Road Accident', 'Fire Accident', 'Water Accident', 'Others'];
       const allStates = await StateModel.find({}).select('state cities').lean();
       const stateNames = allStates.map(s => s.state);
       let stateLength = Math.ceil(Number(stateNames.length) / ITEMS_PER_PAGE);
        let totalCityLength
        let gottenCity = false
        let selectedStateIndex = 0
   
       const getPaged = (list, page) => 
           list.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
   
       // Step 0: Initial menu
       if (text === '') {
           responseLines.push('CON Welcome to DMS medical solutions.\nSelect type of emergency:');
           accidentTypes.forEach((t, i) => responseLines.push(`${i + 1}. ${t}`));
       }
   
       // Step 1: Accident type selected
       else if (levels.length === 1) {
           const accidentIndex = parseInt(levels[0]) - 1;
           if (isNaN(accidentIndex)) return res.send('END Invalid input');
           
           const totalPages = Math.ceil(stateNames.length / ITEMS_PER_PAGE);
           responseLines.push(`CON Select your state (Page 1 of ${totalPages}):`);
           getPaged(stateNames, 1).forEach((state, i) => 
               responseLines.push(`${i + 1}. ${state}`));
           if (stateNames.length > ITEMS_PER_PAGE) responseLines.push('9. More');
       }
   
       // Step 2: State selection with pagination
       else if (levels.length >= 2 && levels.length <= Number(stateLength)) {
           const accidentIndex = parseInt(levels[0]) - 1;
           if (accidentIndex < 0 || accidentIndex >= accidentTypes.length) 
               return res.send('END Invalid accident type');
   
           // Calculate current page state
           const pageClicks = levels.slice(1).filter(l => l === '9').length;
           const currentPage = pageClicks ;
           //const currentPage = pageClicks + 1;
           const lastInput = levels[levels.length - 1];
   
           if (lastInput === '9') {
               const totalPages = Math.ceil(stateNames.length / ITEMS_PER_PAGE);
               if (currentPage >= totalPages) 
                   return res.send('END No more states available');
   
               const nextPage = currentPage + 1;
               responseLines.push(`CON Select your state (Page ${nextPage} of ${totalPages}):`);
               getPaged(stateNames, nextPage).forEach((state, i) => 
                   responseLines.push(`${i + 1}. ${state}`));
               
               if (nextPage < totalPages) responseLines.push('9. More');
           } 
           else {
                stateLength = levels.length;
                console.log('stateLength', stateLength, levels.length)
               //const stateIndex = (currentPage - 1) * ITEMS_PER_PAGE + parseInt(lastInput) - 1;
               const stateIndex = (currentPage) * ITEMS_PER_PAGE + parseInt(lastInput) - 1;

               if (stateIndex >= allStates.length || stateIndex < 0) 
                   return res.send('END Invalid state selection');
   
               const selectedState = allStates[stateIndex];
               selectedStateIndex = stateIndex
               console.log('stateLengthss', stateLength, levels.length, stateIndex, currentPage, lastInput)
               responseLines.push(`CON ${selectedState.state}: Select city (Page 1):`);
               //console.log('selectedState', selectedState)
               getPaged(selectedState.cities, 1).forEach((city, i) => 
                   responseLines.push(`${i + 1}. ${city.city}`));
               
               if (selectedState.cities.length > ITEMS_PER_PAGE) responseLines.push('9. More');
           }
       }
   
       // Step 3: City selection with pagination
       else if (levels.length > Number(stateLength) && !gottenCity) {
            //console.log('LEVEL')
           const stateIndex = getSelectedIndex(levels.slice(0, 2), stateNames.length);
           console.log('selectedStateIndex', selectedStateIndex)
           const selectedState = allStates[stateIndex];
           console.log('selectedStatess', selectedState, stateIndex)
           const cityPage = levels.slice(2).filter(l => l === '9').length + 1;
           const lastInput = levels[levels.length - 1];
           
           const totalCityLength = Math.ceil(selectedState.cities.length / ITEMS_PER_PAGE);

   
           if (lastInput === '9') {
               const totalCityPages = Math.ceil(selectedState.cities.length / ITEMS_PER_PAGE);
               if (cityPage >= totalCityPages) 
                   return res.send('END No more cities available');
   
               const nextPage = cityPage + 1;
               responseLines.push(`CON ${selectedState.state}: Select city (Page ${nextPage}):`);
               getPaged(selectedState.cities, nextPage).forEach((city, i) => 
                   responseLines.push(`${i + 1}. ${city.city}`));
               
               if (nextPage < totalCityPages) responseLines.push('9. More');
           } 
           else {
                gottenCity = true
               //const cityIndex = (cityPage - 1) * ITEMS_PER_PAGE + parseInt(lastInput) - 1;
               //const cityIndex = (lastInput) * ITEMS_PER_PAGE + parseInt(lastInput) - 1;
               
               const cityPageClicks = levels.slice(Number(stateLength)).filter(l => l === '9').length;
                const cityPage = cityPageClicks + 1;
                const lastInput = levels[levels.length - 1];

                const cityIndex = (cityPage - 1) * ITEMS_PER_PAGE + parseInt(lastInput) - 1;

               console.log('cityIndex', cityIndex, selectedState.cities, cityPage)

               if (cityIndex >= selectedState.cities.length || cityIndex < 0)
                return res.send('END Invalid city selection');

               const selectedCity = selectedState.cities[cityIndex];
               console.log('selectedCity', selectedCity)
               responseLines.push(`CON ${selectedCity.city}: Select landmark (Page 1):`);
               getPaged(selectedCity.landmarks, 1).forEach((landmark, i) => 
                   responseLines.push(`${i + 1}. ${landmark.place}`));
               
               if (selectedCity.landmarks.length > ITEMS_PER_PAGE) responseLines.push('9. More');
           }
       }
   
       // Step 4: Landmark selection with pagination
       else {
           const stateIndex = getSelectedIndex(levels.slice(0, 2), stateNames.length);
           const selectedState = allStates[stateIndex];
           const cityIndex = getSelectedIndex(levels.slice(2, 4), selectedState.cities.length);
           const selectedCity = selectedState.cities[cityIndex];
           console.log('selectedCity 2', selectedCity)
           const landmarkPage = levels.slice(4).filter(l => l === '9').length + 1;
           const lastInput = levels[levels.length - 1];
   
           if (lastInput === '9') {
               const totalLandmarkPages = Math.ceil(selectedCity.landmarks.length / ITEMS_PER_PAGE);
               if (landmarkPage >= totalLandmarkPages) 
                   return res.send('END No more landmarks available');
   
               const nextPage = landmarkPage + 1;
               responseLines.push(`CON ${selectedCity.city}: Select landmark (Page ${nextPage}):`);
               getPaged(selectedCity.landmarks, nextPage).forEach((landmark, i) => 
                   responseLines.push(`${i + 1}. ${landmark.place}`));
               
               if (nextPage < totalLandmarkPages) responseLines.push('9. More');
           } 
           else {
               const landmarkIndex = (landmarkPage - 1) * ITEMS_PER_PAGE + parseInt(lastInput) - 1;
               if (landmarkIndex >= selectedCity.landmarks.length || landmarkIndex < 0) 
                   return res.send('END Invalid landmark selection');
   
               const selectedLandmark = selectedCity.landmarks[landmarkIndex];
               const accidentType = accidentTypes[parseInt(levels[0]) - 1];
               
               // Save to database
               await UssdRequestModel.create({
                   phoneNumber,
                   message: `Emergency: ${accidentType} at ${selectedLandmark.place}, ${selectedCity.city}, ${selectedState.state}`,
                   sessionId,
                   selectedAccident: accidentType,
                   selectedPlace: selectedLandmark.place,
                   city: selectedCity.city,
                   state: selectedState.state,
                   lat: selectedLandmark.lat,
                   lng: selectedLandmark.lng,
                   serviceCode,
                   text
               });
   
               responseLines.push(`END Emergency reported successfully!\n` +
                   `Type: ${accidentType}\n` +
                   `Location: ${selectedLandmark.place}\n` +
                   `City: ${selectedCity.city}\n` +
                   `State: ${selectedState.state}\n` +
                   `Coordinates: ${selectedLandmark.lat},${selectedLandmark.lng}`);
           }
       }
   
       res.set('Content-Type', 'text/plain');
       res.send(responseLines.join('\n'));
   }
   */

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
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
        const allStates = await StateModel.find({}).select('state cities').lean();
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

        // Step 5: Hospital selected - confirmation
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
            }).select('name hospitalId email');

            if (hospitalIndex < 0 || hospitalIndex >= hospitals.length)
                return res.send('END Invalid hospital selection');

            const selectedHospital = hospitals[hospitalIndex];

            const ussdRequestId = await generateUniqueCode(9);
            const ussdRequest = await AppointmentUssdRequestModel.create({
                ussdRequestId,
                phoneNumber,
                message: `Appointment: Issues: ${consultationIssues[issueIndex]}`,
                sessionId,
                notificationType: 'Appointment',
                state: `${capitalizeFirstLetter(selectedState)}`,
                city: `${capitalizeFirstLetter(selectedCity)}`,
                issue: `${consultationIssues[issueIndex]}`,
                hospitalId: `${selectedHospital.hospitalId}`
            })

            await sendCustomNotification({
                title: `New Appointment`,
                message: `Appointment: Issues: ${consultationIssues[issueIndex]}`,
                email: `${selectedHospital.email}`
            })

            await UssdNotificationModel.create({
                hospitalId: selectedHospital.hospitalId,
                ussdRequestId,
                notificationId: await generateUniqueCode(9)
            })
 
            responseLines.push(
                `END Appointment confirmed!\n` +
                `State: ${capitalizeFirstLetter(selectedState)}\n` +
                `City: ${capitalizeFirstLetter(selectedCity)}\n` +
                `Issue: ${consultationIssues[issueIndex]}\n` +
                `Hospital: ${selectedHospital.name}\n` +
                `Hospital ID: ${selectedHospital.hospitalId}`
            );
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



  
  
  