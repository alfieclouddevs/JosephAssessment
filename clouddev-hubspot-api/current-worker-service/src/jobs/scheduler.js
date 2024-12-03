import cron from 'node-cron';

const scheduleJobs = async () => {
  console.log('Initializing scheduler...');

  // Schedule the meetings job every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled meetings job...');
    await require('./src/worker')();
  });
};

scheduleJobs();

export default scheduleJobs;
