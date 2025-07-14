// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const subjectSchema = new Schema(
  {
    // name of subject
    name: { type: String, required: true, trim: true },

    // description of subject
    description: { type: String, trim: true },

    // coefficient for calculation factor (currently unused)
    coefficient: { type: Number, required: true },

    // block associated with the subject
    block_id: { type: Schema.Types.ObjectId, required: true, ref: 'block' },

    // tests associated with the subject
    test_ids: [{ type: Schema.Types.ObjectId, ref: 'test' }],

    // status of the subject
    status: { type: String, enum: ['active', 'deleted', 'archived'], default: 'active' },

    // user who created the subject
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // user who updated the subject
    updated_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // deletion date of the subject
    deleted_at: { type: Date },

    // user who deleted the subject
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
module.exports = Mongoose.model('subject', subjectSchema);
