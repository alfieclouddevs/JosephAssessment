export const filterNullValuesFromObject = (obj: Record<string, any>): Record<string, any> => {
    return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== null && value !== undefined));
  };
  
  export const normalizePropertyName = (key: string): string => {
    return key.replace(/^hs_/, '');
  };
  