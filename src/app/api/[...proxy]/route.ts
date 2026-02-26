import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  backendApiBaseUrl,
  isProduction,
  sessionCookieName,
} from '@/lib/server-env';

export const dynamic = 'force-dynamic';

type ProxyContext = {
  params: {
    proxy?: string[];
  };
};

const SESSION_CREATION_PATHS = new Set([
  'auth/login',
  'auth/register',
  'auth/register-tenant-user',
]);

const SESSION_DESTRUCTION_PATHS = new Set(['auth/logout']);

const methodAllowsBody = (method: string) =>
  !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());

const copyHeaderIfPresent = (
  source: NextRequest['headers'],
  target: Headers,
  key: string
) => {
  const value = source.get(key);
  if (value) {
    target.set(key, value);
  }
};

async function proxyToBackend(
  request: NextRequest,
  { params }: ProxyContext
): Promise<NextResponse> {
  const pathSegments = params?.proxy ?? [];
  const relativePath = pathSegments.join('/');

  if (!relativePath) {
    return NextResponse.json({ error: 'Missing API path' }, { status: 404 });
  }

  const targetUrl = new URL(relativePath, `${backendApiBaseUrl}/`);
  targetUrl.search = request.nextUrl.search;

  const outgoingHeaders = new Headers();
  copyHeaderIfPresent(request.headers, outgoingHeaders, 'content-type');
  copyHeaderIfPresent(request.headers, outgoingHeaders, 'accept');
  copyHeaderIfPresent(request.headers, outgoingHeaders, 'accept-language');
  copyHeaderIfPresent(request.headers, outgoingHeaders, 'user-agent');

  const sessionToken = request.cookies.get(sessionCookieName)?.value;
  if (sessionToken) {
    outgoingHeaders.set('Authorization', `Bearer ${sessionToken}`);
  }

  let body: BodyInit | undefined;
  if (methodAllowsBody(request.method)) {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json') || contentType === '') {
      const raw = await request.text();
      body = raw;
    } else {
      const buffer = await request.arrayBuffer();
      body = buffer;
    }
  }

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers: outgoingHeaders,
    body,
    redirect: 'manual',
    cache: 'no-store',
  });

  const responseContentType = backendResponse.headers.get('content-type') ?? '';
  const isJson = responseContentType.includes('application/json');
  const rawPayload = await backendResponse.text();
  let parsedPayload: any = null;

  if (isJson && rawPayload) {
    try {
      parsedPayload = JSON.parse(rawPayload);
    } catch {
      parsedPayload = rawPayload;
    }
  } else if (!isJson) {
    parsedPayload = rawPayload;
  }

  const noContentStatus =
    backendResponse.status === 204 || backendResponse.status === 205;
  const isHeadRequest = request.method.toUpperCase() === 'HEAD';

  let clientPayload = parsedPayload;
  const relativePathKey = relativePath.toLowerCase();

  if (
    isJson &&
    parsedPayload &&
    typeof parsedPayload === 'object' &&
    SESSION_CREATION_PATHS.has(relativePathKey) &&
    backendResponse.ok &&
    parsedPayload.token
  ) {
    clientPayload = { ...parsedPayload };
    delete clientPayload.token;
  }

  let nextResponse: NextResponse;

  if (noContentStatus || isHeadRequest) {
    nextResponse = new NextResponse(null, { status: backendResponse.status });
  } else if (isJson) {
    nextResponse = NextResponse.json(
      clientPayload === undefined ? null : clientPayload,
      { status: backendResponse.status }
    );
  } else {
    nextResponse = new NextResponse(parsedPayload, {
      status: backendResponse.status,
      headers: { 'content-type': responseContentType || 'text/plain' },
    });
  }

  const locationHeader = backendResponse.headers.get('location');
  if (locationHeader) {
    nextResponse.headers.set('location', locationHeader);
  }

  if (
    SESSION_CREATION_PATHS.has(relativePathKey) &&
    backendResponse.ok &&
    parsedPayload?.token
  ) {
    const expiresAt =
      parsedPayload?.expires_at ?? parsedPayload?.expiresAt ?? undefined;
    nextResponse.cookies.set(sessionCookieName, parsedPayload.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      ...(expiresAt ? { expires: new Date(expiresAt) } : {}),
    });
  }

  if (
    SESSION_DESTRUCTION_PATHS.has(relativePathKey) &&
    backendResponse.ok
  ) {
    nextResponse.cookies.delete(sessionCookieName);
  }

  if (backendResponse.status === 401) {
    nextResponse.cookies.delete(sessionCookieName);
  }

  return nextResponse;
}

export {
  proxyToBackend as GET,
  proxyToBackend as POST,
  proxyToBackend as PUT,
  proxyToBackend as PATCH,
  proxyToBackend as DELETE,
  proxyToBackend as HEAD,
  proxyToBackend as OPTIONS,
};
