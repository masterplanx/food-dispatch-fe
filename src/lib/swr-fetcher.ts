import axios from 'axios';

export const swrFetcher = async <T = unknown>(url: string): Promise<T> => {
  const response = await axios.get<T>(url);
  return response.data;
};

