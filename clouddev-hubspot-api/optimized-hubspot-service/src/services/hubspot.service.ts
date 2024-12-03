import { Client as HubSpotClient } from '@hubspot/api-client';

const hubspotClient = new HubSpotClient();

/**
 * Sets the HubSpot access token.
 */
export const setAccessToken = (accessToken: string): void => {
  console.log('Setting access token...');
  hubspotClient.setAccessToken(accessToken);
};
 
/**
 * Refreshes the HubSpot access token.
 */
export const refreshAccessToken = async (clientId: string, clientSecret: string, refreshToken: string) => {
  console.log('Refreshing access token...');
  const response = await hubspotClient.oauth.tokensApi.create(
    'refresh_token',
    undefined,
    undefined,
    clientId,
    clientSecret,
    refreshToken
  );
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresIn: response.expiresIn,
  };
};

/**
 * Fetches a page of meetings.
 */
export const fetchMeetings = async (limit: number, after?: string) => {
  console.log('Fetching meetings...');
  try {
    const response = await hubspotClient.crm.objects.meetings.basicApi.getPage(limit, after);
    return response;
  } catch (error: any) {
    // Check for access token expiration
    if (error?.response?.status === 401) {
      console.error('Access token expired. Refreshing...');
      throw new Error('TOKEN_EXPIRED');
    }
    throw error;
  }
};

/**
 * Fetches the contact associated with a meeting.
 */
export const fetchContactForMeeting = async (meetingId: string) => {
  console.log('Fetching contact for meeting:', meetingId);
  try {
    const contactAssociation = await hubspotClient.crm.associations.v4.basicApi.getPage(
      'meeting',
      meetingId,
      'contact'
    );
    const contactId = contactAssociation.results[0]?.toObjectId;

    if (contactId) {
      const contact = await hubspotClient.crm.contacts.basicApi.getById(contactId, ['email']);
      return contact?.properties?.email || null;
    }
    return null;
  } catch (error: any) {
    // Check for access token expiration
    if (error?.response?.status === 401) {
      console.error('Access token expired. Refreshing...');
      throw new Error('TOKEN_EXPIRED');
    }
    throw error;
  }
};
