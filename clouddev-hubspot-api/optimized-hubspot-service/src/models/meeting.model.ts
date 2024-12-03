import mongoose, { Schema, Document } from 'mongoose';

export interface Meeting extends Document {
  meeting_id: string;
  meeting_title: string;
  meeting_start_time: Date;
  meeting_end_time: Date;
  contact_email: string;
}

const MeetingSchema: Schema = new Schema({
  meeting_id: { type: String, required: true, unique: true },
  meeting_title: { type: String, required: true },
  meeting_start_time: { type: Date, required: true },
  meeting_end_time: { type: Date, required: true },
  contact_email: { type: String, required: true },
});

export default mongoose.model<Meeting>('Meeting', MeetingSchema);
