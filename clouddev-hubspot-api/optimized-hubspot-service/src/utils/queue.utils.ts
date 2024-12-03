import { queue } from 'async';
import _ from 'lodash';
import { goal } from './goal.utils';


export const createQueue = (domain: any, actions: any[]): ReturnType<typeof queue> => {
  return queue(async (action, callback) => {
    console.log('Queue received action:', action);
    actions.push(action);

    // Batch process when actions reach 2000
    if (actions.length >= 2000) {
      console.log('Batch processing actions:', {
        domain: domain.apiKey,
        count: actions.length,
      });

      // Clone actions for safe processing
      const batch = _.cloneDeep(actions);
      actions.splice(0, actions.length);

      // Perform action processing using the `goal` function
      try {
        await goal(batch); 
      } catch (error) {
        console.error('Error processing batch:', error);
      }
    }

    callback();
  }, 100); // Limit the concurrency to avoid overloading
};

export const drainQueue = async (domain: any, actions: any[], q: ReturnType<typeof queue>): Promise<void> => {
  console.log('Draining queue...');

  // Ensure the queue finishes all pending tasks
  if (q.length() > 0) {
    await q.drain();
  }

  if (actions.length > 0) {
    try {
      await goal(actions); 
    } catch (error) {
      console.error('Error processing remaining actions:', error);
    }
  }

  console.log('Queue drained successfully.');
};

// Mocked batch processing function
const processBatch = async (batch: any[]): Promise<void> => {
  // Simulate processing a batch of actions
  console.log('Processing batch of size:', batch.length);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async work
};
