 /**
 * excludeId: id of the user to be excluded
 * excludeId is optional, used to check if the email is used by user other than the one to be excluded
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

module.exports = {EmailIsExist}