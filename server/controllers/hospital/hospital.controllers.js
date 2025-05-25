import { sendResponse } from "../../middlewares/utils.js";
import HospitalModel from "../../model/Hospital.js"

export async function getHospitals(req, res) {
    const { limit = 10, page = 1, verified, blocked } = req.query;

    // Validate query params
    if (verified && verified !== 'true' && verified !== 'false') {
        return sendResponse(res, 400, false, null, 'Verified must be a boolean value');
    }
    if (blocked && blocked !== 'true' && blocked !== 'false') {
        return sendResponse(res, 400, false, null, 'Blocked must be a boolean value');
    }

    const query = {};
    if (verified !== undefined) {
        query.verified = verified === 'true';
    }
    if (blocked !== undefined) {
        query.blocked = blocked === 'true';
    }

    try {
        const totalHospitals = await HospitalModel.countDocuments(query);
        const totalPages = Math.ceil(totalHospitals / limit);
        const skip = (Number(page) - 1) * Number(limit);

        const hospitals = await HospitalModel.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(skip)
            .lean();

        sendResponse(res, 200, true,
            {
                data: hospitals,
                total: totalHospitals,
                totalPages,
                currentPage: Number(page),
                limit: Number(limit),
            },
            'Hospitals fetched successfully'
        );
    } catch (error) {
        console.error('UNABLE TO GET HOSPITALS', error);
        sendResponse(res, 500, false, null, 'Unable to get hospitals');
    }
}