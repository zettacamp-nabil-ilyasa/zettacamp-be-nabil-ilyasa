// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const notationSchema = new Schema({
  notation_text: { type: String, required: true, trim: true },
  max_point: { type: Number, required: true },
});

const testSchema = new Schema(
  {
    // name of test
    name: { type: String, required: true, trim: true },

    // description of test
    description: { type: String, trim: true },

    // array of notation object consisted of notation_text and max_point
    notations: [notationSchema],

    // the weight or proportion of the test
    weight: { type: Number, required: true },

    // subject associated with the test
    subject_id: { type: Schema.Types.ObjectId, ref: 'subject' },

    // status of the test
    status: { type: String, enum: ['not_published', 'published', 'deleted'], default: 'active' },

    // the date when the test is published
    published_date: { type: Date },

    // user who created the test
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // user who updated the test
    updated_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // deletion date of the test
    deleted_at: { type: Date },

    // user who deleted the test
    deleted_by: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  {
    // Timestamp set-up for createdAt and updatedAt
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// *************** EXPORT MODULE ***************
module.exports = Mongoose.model('test', testSchema);
