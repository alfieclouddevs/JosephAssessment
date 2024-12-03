import dotenv from 'dotenv';
dotenv.config();

export const config = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/worker',
  hubspotClientId: process.env.HUBSPOT_CLIENT_ID || '',
  hubspotClientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
  port: process.env.PORT || 3000,
};
