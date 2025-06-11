/**
 * Function description
 * @param {object} model - model used for db query
 * @param {string} emailAcc - email to be checked
 * @param {string} excludeId - id of the user to be excluded
 * @returns {boolean} - true if email already exist 
 */


async function EmailIsExist(model, emailAcc, excludeId = null) {
    const isExist = await model.findOne({email: emailAcc})
    //check if email already exist
    if (!isExist){
        return false
    }
    //check if existed email is the one to be excluded
    if (excludeId && isExist.id.toString() == excludeId.toString()) {
        return false
    } 
    //return true, email already used by another user
    return true
}

async function CollectionIsExist(model, userId){
    const isExist = await model.findOne({_id: userId})
    //check if user already exist
    if (!isExist){
        return false
    }
    return true
}

function CleanUpdateInput (updateInput){
    const cleanUpdateInput = Object.fromEntries(Object.entries(updateInput).filter(([_, value]) => value !== null && value !== "" && value !== undefined))
    return cleanUpdateInput
}

// *************** EXPORT MODULE ***************
module.exports = {EmailIsExist, CleanUpdateInput}