// *************** IMPORT LIBRARY ***************
const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

// *************** IMPORT MODULE ***************
const { syllabusStatus } = require('../../shared/strings');

const blockSchema = new Schema(
  {
    // name of the block
    name: { type: String, required: true, trim: true },

    // description of the block
    description: { type: String, trim: true },

    // list of subjects that belongs to the block
    subject_ids: [{ type: Schema.Types.ObjectId, ref: 'subject' }],

    // status of the block
    status: { type: String, enum: syllabusStatus, default: 'active', trim: true },

    // user who created the block
    created_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // user who updated the block
    updated_by: { type: Schema.Types.ObjectId, ref: 'user' },

    // Timestamp when the block was marked as deleted
    deleted_at: { type: Date },

    // user who deleted the block
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
module.exports = Mongoose.model('block', blockSchema);
