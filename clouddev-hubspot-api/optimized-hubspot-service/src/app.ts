import connectToDatabase from './config/db.config';
import DomainModel from './models/domain.model';
import { runMeetingsJob } from './jobs/meeting.job';

import dotenv from 'dotenv';
dotenv.config();

const startWorker = async () => {
  console.log('Initializing worker service...');

  // Connect to MongoDB
  await connectToDatabase();

  // Retrieve the domain and process accounts
  const domain = await DomainModel.findOne({});
  if (!domain) {
    console.error('No domain found in the database.');
    process.exit(1);
  }

  for (const account of domain.integrations.hubspot.accounts) {
    await runMeetingsJob(domain, account.hubId);
  }

  console.log('Worker finished.');
  process.exit();
};

startWorker();
