import mongoose, { Schema, Document } from 'mongoose';

export interface HubSpotAccount {
  hubId: string;
  accessToken: string;
  refreshToken: string;
  lastPulledDates: {
    meetings?: string;
    contacts?: string;
    companies?: string;
  };
}

export interface Domain extends Document {
  company: {
    name: string;
    website: string;
  };
  integrations: {
    hubspot: {
      status: boolean;
      accounts: HubSpotAccount[];
    };
  };
  apiKey: string;
  customerDBName: string;
}

const DomainSchema: Schema = new Schema({
  company: {
    name: { type: String, required: true },
    website: { type: String, required: true },
  },
  integrations: {
    hubspot: {
      status: { type: Boolean, default: false },
      accounts: [
        {
          hubId: String,
          accessToken: String,
          refreshToken: String,
          lastPulledDates: {
            meetings: { type: String, default: null },
            contacts: { type: String, default: null },
            companies: { type: String, default: null },
          },
        },
      ],
    },
  },
  apiKey: { type: String, required: true },
  customerDBName: { type: String, required: true },
});

export default mongoose.model<Domain>('Domain', DomainSchema);