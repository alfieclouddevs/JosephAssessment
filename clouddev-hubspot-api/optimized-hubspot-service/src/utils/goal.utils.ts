import { AnyBulkWriteOperation } from 'mongodb';
import Meeting from '../models/meeting.model'
interface Action {
  meetingProperties: {
    meeting_id: string;
    [key: string]: any; 
  };
}

export const goal = async (actions: Action[]): Promise<void> => {
  try {
    // Map actions to MongoDB bulk operations
    const bulkOperations: AnyBulkWriteOperation<Action>[] = actions.map((action) => ({
      updateOne: {
        filter: { meeting_id: action.meetingProperties.meeting_id },
        update: { $set: action.meetingProperties },
        upsert: true,
      },
    }));

    await Meeting.bulkWrite(bulkOperations);
    console.log('Successfully saved meetings to the database:', actions.length);
  } catch (err) {
    console.error('Error saving meetings to the database:', err);
  }
};
