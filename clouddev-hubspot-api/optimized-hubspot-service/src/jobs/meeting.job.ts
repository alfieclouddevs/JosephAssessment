import { Domain } from '../models/domain.model';
import { processMeetings } from '../services/meeting.service';
import { createQueue, drainQueue } from '../utils/queue.utils';

export const runMeetingsJob = async (domain: Domain, hubId: string): Promise<void> => {
  console.log('Starting meetings job...');
  const actions: any[] = [];
  const queue = createQueue(domain, actions);

  try {
    await processMeetings(domain, hubId, queue);
    await drainQueue(domain, actions, queue);
    console.log('Meetings job completed successfully.');
  } catch (error) {
    console.error('Error running meetings job:', error);
  }
};
