const disallowedValues = [
    '[not provided]',
    'placeholder',
    '[[unknown]]',
    'not set',
    'not provided',
    'unknown',
    'undefined',
    'n/a'
  ];
  
  const filterNullValuesFromObject = (object) => {
    const filteredEntries = Object.entries(object).filter(([_, v]) => {
      const isString = typeof v === 'string';
      const isDisallowed = isString && disallowedValues.includes(v.toLowerCase());
      const containsRecord = isString && v.toLowerCase().includes('!$record');
      return v !== null && v !== '' && typeof v !== 'undefined' && !(isDisallowed || containsRecord);
    });
    return Object.fromEntries(filteredEntries);
  };
  
  const normalizePropertyName = (key) => {
    return key.toLowerCase()
      .replace(/__c$/, '')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  };
  
  const goal = async (actions) => {
    try {
      const Meeting = require('../models/Meeting');
  
      const bulkOperations = actions.map((action) => ({
        updateOne: {
          filter: { meeting_id: action.meetingProperties.meeting_id },
          update: { $set: action.meetingProperties },
          upsert: true,
        },
      }));
  
      await Meeting.bulkWrite(bulkOperations);
      console.log(`Successfully saved ${actions.length} meetings to database.`);
    } catch (err) {
      console.error('Error saving meetings to database:', err);
    }
  };
  
  module.exports = {
    filterNullValuesFromObject,
    normalizePropertyName,
    goal
  };
  