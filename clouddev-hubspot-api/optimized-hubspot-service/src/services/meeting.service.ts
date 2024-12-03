import { fetchMeetings, fetchContactForMeeting, setAccessToken, refreshAccessToken } from './hubspot.service';

export const processMeetings = async (domain: any, hubId: string, queue: any): Promise<void> => {
  const account = domain.integrations.hubspot.accounts.find((acc: any) => acc.hubId === hubId);
  if (!account) throw new Error(`Account with hubId ${hubId} not found`);

  // Set the initial access token
  setAccessToken(account.accessToken);

  let hasMore = true;
  const limit = 100;
  let after: string | undefined;

  while (hasMore) {
    try {
      // Fetch meetings
      const meetings = await fetchMeetings(limit, after);
      for (const meeting of meetings.results) {
        const contactEmail = await fetchContactForMeeting(meeting.id);
        queue.push({
          actionName: 'Meeting Created',
          actionDate: new Date(meeting.createdAt),
          meetingProperties: {
            meeting_id: meeting.id,
            meeting_title: meeting.properties.hs_meeting_title,
            meeting_start_time: meeting.properties.hs_meeting_start_time,
            meeting_end_time: meeting.properties.hs_meeting_end_time,
            contact_email: contactEmail,
          },
        });
      }

      after = meetings.paging?.next?.after;
      hasMore = Boolean(after);
    } catch (error: any) {
      if (error.message === 'TOKEN_EXPIRED') {
        // Refresh the token and retry
        const { accessToken, refreshToken } = await refreshAccessToken(
          process.env.HUBSPOT_CID!,
          process.env.HUBSPOT_CS!,
          account.refreshToken
        );
        account.accessToken = accessToken;
        account.refreshToken = refreshToken;
        setAccessToken(accessToken);
        console.log('Access token refreshed. Retrying API call...');
        continue;
      }
      throw error;
    }
  }

  console.log('Finished processing meetings for account:', hubId);

  account.lastPulledDates.meetings = new Date().toISOString();
};
