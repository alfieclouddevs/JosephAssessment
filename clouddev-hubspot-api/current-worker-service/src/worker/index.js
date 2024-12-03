const hubspot = require('@hubspot/api-client');
const { queue } = require('async');
const _ = require('lodash');

const { filterNullValuesFromObject, goal, normalizePropertyName } = require('../utils');
const Domain = require('../models/Domain');

const hubspotClient = new hubspot.Client({ accessToken: '' });
let expirationDate;

const generateLastModifiedDateFilter = (date, nowDate, propertyName = 'hs_lastmodifieddate') => {
  const lastModifiedDateFilter = date
    ? {
      filters: [
        { propertyName, operator: 'GTE', value: `${date.valueOf()}` },
        { propertyName, operator: 'LTE', value: `${nowDate.valueOf()}` },
      ],
    }
    : {};

  return lastModifiedDateFilter;
};

const saveDomain = async (domain) => {
  domain.markModified('integrations.hubspot.accounts');
  return await domain.save();
};

/**
 * Get access token from HubSpot
 */
const refreshAccessToken = async (domain, hubId) => {
  const { HUBSPOT_CID, HUBSPOT_CS } = process.env;
  const account = domain.integrations.hubspot.accounts.find((account) => account.hubId === hubId);
  const { refreshToken } = account;

  if (!refreshToken) {
    console.error('No refresh token available for account:', hubId);
    return false;
  }

  try {
    const response = await hubspotClient.oauth.tokensApi.create(
      'refresh_token',
      undefined,
      undefined,
      HUBSPOT_CID,
      HUBSPOT_CS,
      refreshToken
    );
    console.log('Token API response:', response);

    const newAccessToken = response.accessToken; 
    const newRefreshToken = response.refreshToken; 
    const expiresIn = response.expiresIn;

    if (!newAccessToken) {
      console.error('Failed to retrieve new access token from response:', response);
      return false;
    }

    // Set expiration time
    expirationDate = new Date(expiresIn * 1000 + Date.now());
    hubspotClient.setAccessToken(newAccessToken);

    console.log('Updated access token for account:', hubId);
    account.accessToken = newAccessToken;

    if (newRefreshToken && newRefreshToken !== refreshToken) {
      console.log('Updated refresh token for account:', hubId);
      account.refreshToken = newRefreshToken; 
    }

    return true;
  } catch (error) {
    console.error('Error refreshing access token for account:', hubId, error);
    return false;
  }
};


/**
 * Process meetings and create actions
 */
const processMeetings = async (domain, hubId, q) => {
  console.log('Starting to process meetings for account:', hubId);

  const account = domain.integrations.hubspot.accounts.find((account) => account.hubId === hubId);
  const lastPulledDate = new Date(account.lastPulledDates.meetings || '1970-01-01T00:00:00Z');
  const now = new Date();

  console.log(`Fetching meetings modified between ${lastPulledDate} and ${now}`);

  const lastModifiedDateFilter = generateLastModifiedDateFilter(lastPulledDate, now);

  let hasMore = true;
  const offsetObject = {};
  const limit = 100;

  while (hasMore) {
    console.log('Fetching batch of meetings...');
    const searchObject = {
      filterGroups: [lastModifiedDateFilter],
      properties: ['hs_meeting_title', 'hs_meeting_start_time', 'hs_meeting_end_time', 'createdAt', 'updatedAt'],
      limit,
      after: offsetObject.after,
    };

    let searchResult = {};

    let tryCount = 0;
    while (tryCount <= 4) {
      try {
        searchResult = await hubspotClient.crm.objects.meetings.basicApi.getPage(limit, offsetObject.after);
        console.log(`Fetched ${searchResult.results.length} meetings.`);
        break;
      } catch (err) {
        tryCount++; 
        console.error(`Error fetching meetings (attempt ${tryCount}):`, err);
        if (new Date() > expirationDate) await refreshAccessToken(domain, hubId);
        await new Promise((resolve) => setTimeout(resolve, 5000 * Math.pow(2, tryCount)));
      }
    }

    if (!searchResult || !searchResult.results) {
      console.error('No meetings found or failed to fetch meetings.');
      return;
    }
    console.log('SEARCH RESULTS---', searchResult.results)
    const meetings = searchResult.results || [];
    offsetObject.after = searchResult?.paging?.next?.after;

    for (const meeting of meetings) {
      if (!meeting.properties) continue;

      console.log('Processing meeting:', meeting.id);

      const isCreated = !lastPulledDate || new Date(meeting.createdAt) > lastPulledDate;
      const actionName = isCreated ? 'Meeting Created' : 'Meeting Updated';

      let contactEmail = null;
      try {
        const contactAssociation = await hubspotClient.crm.associations.v4.basicApi.getPage(
          'meeting',
          meeting.id,
          'contact'
        );
        const contactId = contactAssociation?.results?.[0]?.toObjectId;
        if (contactId) {
          const contact = await hubspotClient.crm.contacts.basicApi.getById(contactId, ['email']);
          contactEmail = contact?.properties?.email;
        }
      } catch (err) {
        console.error(`Error fetching contact for meeting ID ${meeting.id}:`, err);
      }
      // Normalize and filter properties
      const normalizedProperties = Object.fromEntries(
        Object.entries(meeting.properties).map(([key, value]) => [normalizePropertyName(key), value])
      );
      const actionTemplate = {
        includeInAnalytics: 0,
        meetingProperties: filterNullValuesFromObject({
          meeting_id: meeting.id,
          meeting_title: normalizedProperties.hs_meeting_title,
          meeting_details: normalizedProperties.hs_meeting_details,
          meeting_start_time: normalizedProperties.hs_meeting_start_time,
          meeting_end_time: normalizedProperties.hs_meeting_end_time,
          contact_email: contactEmail,
        }),
      };

      q.push({
        actionName,
        actionDate: new Date(isCreated ? meeting.createdAt : meeting.updatedAt),
        ...actionTemplate,
      });
    }

    if (!offsetObject?.after) {
      console.log('No more meetings to fetch.');
      hasMore = false;
    }
  }

  console.log('Finished processing meetings for account:', hubId);

  account.lastPulledDates.meetings = now;
  await saveDomain(domain);
};



const createQueue = (domain, actions) =>
  queue(async (action, callback) => {
    console.log('Queue received action:', action);
    actions.push(action);

    if (actions.length > 2000) {
      console.log('Inserting actions to database', { apiKey: domain.apiKey, count: actions.length });

      const copyOfActions = _.cloneDeep(actions);
      actions.splice(0, actions.length);

      goal(copyOfActions);
    }

    callback();
  }, 100000000);

const drainQueue = async (domain, actions, q) => {
  if (q.length() > 0) await q.drain();

  if (actions.length > 0) {
    goal(actions);
  }

  return true;
};

const pullDataFromHubspot = async () => {
  console.log('Start pulling data from HubSpot');

  const domain = await Domain.findOne({});
  if (!domain) {
    console.error('No domain found in the database.');
    process.exit(1);
  }

  console.log('Retrieved domain:', JSON.stringify(domain, null, 2));

  for (const account of domain.integrations.hubspot.accounts) {
    console.log('Start processing account:', account.hubId);

    try {
      const refreshed = await refreshAccessToken(domain, account.hubId);
      if (refreshed) {
        console.log('Access token refreshed successfully. Proceeding to fetch meetings...');
      } else {
        console.error('Access token refresh failed. Skipping account.');
        continue;
      }
    } catch (err) {
      console.error('Error refreshing access token:', err);
      continue;
    }

    const actions = [];
    const q = createQueue(domain, actions);

    try {
      await processMeetings(domain, account.hubId, q);
      console.log('Processed meetings successfully.');
    } catch (err) {
      console.error('Error processing meetings for account:', err);
    }

    try {
      await drainQueue(domain, actions, q);
      console.log('Drained queue successfully.');
    } catch (err) {
      console.error('Error draining queue:', err);
    }

    try {
      await saveDomain(domain);
      console.log('Domain saved successfully.');
    } catch (err) {
      console.error('Error saving domain:', err);
    }

    console.log('Finished processing account:', account.hubId);
  }

  console.log('Finished pulling data from HubSpot.');
  process.exit();
};


module.exports = pullDataFromHubspot;
