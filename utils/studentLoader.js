const DataLoader = require('dataloader')
const Student = require('../graphql/student/student.model.js')

async function batchStudentsBySchoolId(schoolIds) {
    console.log("Loaded schoolIds:", schoolIds)
    const students = await Student.find({school_id : {$in : schoolIds}, status : {$ne : 'deleted'}})
    const studentsGrouped = schoolIds.map(schoolId => students.filter(student => student.school_id.toString() === schoolId.toString()))
    return studentsGrouped
}

async function batchStudentByUserId (userIds) {
    console.log("Loaded userIds:", userIds)
    const students = await Student.find({user_id : {$in : userIds}, status : {$ne : 'deleted'}})
    const studentsGrouped = userIds.map(userId => students.find(student => student.user_id.toString() === userId.toString()))
    return studentsGrouped

}

const studentBySchoolLoader = () => {
    console.log("studentLoader created");
    return new DataLoader(batchStudentsBySchoolId)
}

const studentByUserLoader = () => {
    console.log("studentLoader created");
    return new DataLoader(batchStudentByUserId)
}

module.exports = {studentBySchoolLoader, studentByUserLoader}