import HospitalModel from "./model/Hospital.js";
import RefreshTokenModel from "./model/RefreshToken.js";
import UssdNotificationModel from "./model/UssdNotification.js";
import UssdRequestModel from "./model/EmergencyUssdRequest.js";

async function dele() {
    try {
        const dele1= await HospitalModel.deleteMany()
        const dele2 = await UssdNotificationModel.deleteMany()
        const dele3 = await UssdRequestModel.deleteMany()
        //const dele4 = await RefreshTokenModel.deleteMany()

        console.log('DELETED', dele1, dele2, dele3, dele4)
    } catch (error) {
        console.log('ERROR', error)
    }
}
dele()

//original
export async function ussd(req, res) {
    const { phoneNumber, text, sessionId, serviceCode } = req.body;
    const levels = text.trim().split('*');
    const responseLines = [];
    console.log('USSD Access:', text);

    const accidentTypes = ['Snake bite', 'Road Accident', 'Fire Accident', 'Water Accident', 'Others'];
    const allStates = await StateModel.find({}).select('state cities').lean();
    const stateNames = allStates.map(s => s.state);

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

    // Step 2: State selection with dynamic pagination
    else {
        let pointer = 0;
        const accidentIndex = parseInt(levels[pointer++]) - 1;
        if (accidentIndex < 0 || accidentIndex >= accidentTypes.length) 
            return res.send('END Invalid accident type');

        // Process state selection
        let statePage = 1;
        while(levels[pointer] === '9') {
            statePage++;
            pointer++;
        }
        
        if (pointer >= levels.length) {
            // Show current state page
            const totalPages = Math.ceil(stateNames.length / ITEMS_PER_PAGE);
            if (statePage > totalPages) return res.send('END Invalid page');
            
            responseLines.push(`CON Select your state (Page ${statePage} of ${totalPages}):`);
            getPaged(stateNames, statePage).forEach((state, i) => 
                responseLines.push(`${i + 1}. ${state}`));
            if (statePage < totalPages) responseLines.push('9. More');
        } 
        else {
            // State selected - process city selection
            const stateIndex = (statePage - 1) * ITEMS_PER_PAGE + parseInt(levels[pointer++]) - 1;
            if (stateIndex >= allStates.length || stateIndex < 0) 
                return res.send('END Invalid state selection');

            const selectedState = allStates[stateIndex];
            
            // Process city pagination
            let cityPage = 1;
            while(levels[pointer] === '9') {
                cityPage++;
                pointer++;
            }

            if (pointer >= levels.length) {
                // Show current city page
                const totalCityPages = Math.ceil(selectedState.cities.length / ITEMS_PER_PAGE);
                if (cityPage > totalCityPages) return res.send('END Invalid city page');
                
                responseLines.push(`CON ${selectedState.state}: Select city (Page ${cityPage}):`);
                getPaged(selectedState.cities, cityPage).forEach((city, i) => 
                    responseLines.push(`${i + 1}. ${city.city}`));
                if (cityPage < totalCityPages) responseLines.push('9. More');
            }
            else {
                // City selected - process landmark selection
                const cityIndex = (cityPage - 1) * ITEMS_PER_PAGE + parseInt(levels[pointer++]) - 1;
                if (cityIndex >= selectedState.cities.length || cityIndex < 0)
                    return res.send('END Invalid city selection');

                const selectedCity = selectedState.cities[cityIndex];
                
                // Process landmark pagination
                let landmarkPage = 1;
                while(levels[pointer] === '9') {
                    landmarkPage++;
                    pointer++;
                }

                if (pointer >= levels.length) {
                    // Show current landmark page
                    const totalLandmarkPages = Math.ceil(selectedCity.landmarks.length / ITEMS_PER_PAGE);
                    if (landmarkPage > totalLandmarkPages) return res.send('END Invalid landmark page');
                    
                    responseLines.push(`CON ${selectedCity.city}: Select landmark (Page ${landmarkPage}):`);
                    getPaged(selectedCity.landmarks, landmarkPage).forEach((landmark, i) => 
                        responseLines.push(`${i + 1}. ${landmark.place}`));
                    if (landmarkPage < totalLandmarkPages) responseLines.push('9. More');
                }
                else {
                    // Landmark selected - final confirmation
                    const landmarkIndex = (landmarkPage - 1) * ITEMS_PER_PAGE + parseInt(levels[pointer]) - 1;
                    if (landmarkIndex >= selectedCity.landmarks.length || landmarkIndex < 0) 
                        return res.send('END Invalid landmark selection');

                    const selectedLandmark = selectedCity.landmarks[landmarkIndex];
                    
                    // Save to database
                    const ussdRequestId = await generateUniqueCode(9)
                    const ussdRequest = await UssdRequestModel.create({
                        ussdRequestId,
                        phoneNumber,
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

                    // Notify nearby hospitals
                    setImmediate(() => notifyNearbyHospitals(ussdRequest));
                }
            }
        }
    }

    res.set('Content-Type', 'text/plain');
    res.send(responseLines.join('\n'));
}
