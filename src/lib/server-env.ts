const DEFAULT_PROTOCOL = process.env.FOOD_DISPATCH_API_PROTOCOL ?? 'http';
const DEFAULT_HOST = process.env.FOOD_DISPATCH_API_HOST ?? 'localhost';
const DEFAULT_PORT = process.env.FOOD_DISPATCH_API_PORT ?? '8080';
const DEFAULT_BASE_PATH = process.env.FOOD_DISPATCH_API_BASE_PATH ?? '/api';

const explicitBaseUrl = process.env.FOOD_DISPATCH_API_BASE_URL;

const trimmedBasePath = DEFAULT_BASE_PATH.startsWith('/')
  ? DEFAULT_BASE_PATH
  : `/${DEFAULT_BASE_PATH}`;

const computedBaseUrl = `${DEFAULT_PROTOCOL}://${DEFAULT_HOST}${
  DEFAULT_PORT ? `:${DEFAULT_PORT}` : ''
}${trimmedBasePath}`;

export const backendApiBaseUrl = (explicitBaseUrl ?? computedBaseUrl).replace(
  /\/$/,
  ''
);

export const isProduction = process.env.NODE_ENV === 'production';

export const sessionCookieName =
  process.env.FOOD_DISPATCH_SESSION_COOKIE ?? 'fd_session';
