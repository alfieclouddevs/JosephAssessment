import cron from 'node-cron';
import DomainModel from '../models/domain.model';
import { runMeetingsJob } from './meeting.job';

const scheduleJobs = async () => {
  console.log('Initializing scheduler...');

  // Schedule the meetings job every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled meetings job...');

    const domain = await DomainModel.findOne({});
    if (!domain) {
      console.error('No domain found in the database.');
      return;
    }

    for (const account of domain.integrations.hubspot.accounts) {
      try {
        await runMeetingsJob(domain, account.hubId);
      } catch (error) {
        console.error(`Error running meetings job for account ${account.hubId}:`, error);
      }
    }
  });
};

scheduleJobs();

export default scheduleJobs;
