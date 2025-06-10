const DataLoader = require('dataloader')
const Student = require('../graphql/student/student.model.js')

const batchStudentsBySchoolId = async (schoolIds) => {
    console.log("Loaded schoolIds:", schoolIds);
    const students = await Student.find({school_id : {$in : schoolIds}})
    const studentsGrouped = schoolIds.map(schoolId => students.filter(student => student.school_id.toString() === schoolId.toString()))
    return studentsGrouped
}

const studentLoader = () => {
    console.log("studentLoader created");
    return new DataLoader(batchStudentsBySchoolId)
}

module.exports = studentLoader