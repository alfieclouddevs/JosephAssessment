const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema(
  {
    meeting_id: { type: String, unique: true, required: true },
    meeting_title: String,
    meeting_details: String,
    meeting_start_time: Date,
    meeting_end_time: Date,
    contact_email: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meeting', MeetingSchema);
