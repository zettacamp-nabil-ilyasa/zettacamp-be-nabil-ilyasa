/**
 * Function description
 * @param {object} model - model used for db query
 * @param {string} schoolName - school name to be checked
 * @param {string} excludeId - id of the school to be excluded
 * @returns {boolean} - true if school name already exist 
 */

async function NameIsExist(model, schoolName, excludeId = null) {
    const isExist = await model.findOne({name: schoolName})
    //check if school name already exist
    if (!isExist){
        return false
    }
    //check if existed school is the one to be excluded
    if (excludeId && isExist.id.toString() == excludeId.toString()) {
        return false
    } 
    //return true, school name already registered
    return true
}

// *************** EXPORT MODULE ***************
module.exports = {NameIsExist}
