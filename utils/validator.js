/**
 * Check if email already exist
 * @param {object} model - The model used for db query.
 * @param {string} emailAcc - The email to be checked.
 * @param {string} excludeId - The id of the user to be excluded.
 * @returns {boolean} - True if email already exist, false otherwise
 */
async function EmailIsExist(model, emailAcc, excludeId = null) {
    try{
        const isExist = await model.findOne({email: emailAcc})
        //*************** check if email already exist
        if (!isExist){
            return false
        }
         //*************** check if existed email is the one to be excluded
        if (excludeId && isExist.id.toString() == excludeId.toString()) {
            return false
        } 
         //*************** return true, email already used by another user
        return true
    }catch(error){
        console.log("logging error: ", error.message)
        throw error
    }
  
}

/**
 * Check if a collection with the given ID with given model already exists.
 * @param {object} model - The model used for db query.
 * @param {string} userId - The id of the user to be checked.
 * @returns {boolean} - True if user already exist, false otherwise.
 */
async function CollectionIsExist(model, userId){
    try{
        const isExist = await model.findOne({_id: userId})
        ///*************** check if user already exist
        if (!isExist){
            return false
        }
        return true
    }catch(error){
        console.log("logging error: ", error.message)
        throw error
    }
}

/**
 * Clean updateInput from null, undefined, and empty string
 * @param {object} updateInput - The input object containing updated data.
 * @returns {object} - The cleaned updateInput.
 */
function CleanUpdateInput (updateInput){
     //*************** clean updateInput from null, undefined, and empty string
    const cleanUpdateInput = Object.fromEntries(Object.entries(updateInput).filter(([_, value]) => value !== null && value !== "" && value !== undefined))
    return cleanUpdateInput
}

// *************** EXPORT MODULE ***************
module.exports = {EmailIsExist, CleanUpdateInput, CollectionIsExist}