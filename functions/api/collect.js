/**
 * Data submission endpoint
 * Only accepts POST requests at /api/collect
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Get auth token from environment
    const expectedToken = env.AUTH_TOKEN;
    if (!expectedToken) {
      return new Response('Configuration error', { status: 500 });
    }

    // Check authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.substring(7);
    if (token !== expectedToken) {
      return new Response('Forbidden', { status: 403 });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return new Response('Bad Request', { status: 400 });
    }

    // Extract client information
    const clientIP = request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For') ||
      'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const timestamp = new Date().toISOString();

    // Validate required payload structure
    if (!requestData.payload?.source || !requestData.payload?.summary) {
      return new Response('Bad Request', { status: 400 });
    }

    // Create log entry
    const logEntry = {
      id: crypto.randomUUID(),
      timestamp,
      actual_request_details: {
        client_ip: clientIP,
        user_agent: userAgent,
        cf_ray: request.headers.get('CF-Ray'),
        cf_country: request.headers.get('CF-IPCountry')
      },
      submitted_request_details: requestData.request_details || {},
      payload: requestData.payload
    };

    // Store in KV if available
    if (env.SECURITY_LOGS) {
      const key = `log_${timestamp.replace(/[:.]/g, '-')}_${logEntry.id.substring(0, 8)}`;
      await env.SECURITY_LOGS.put(key, JSON.stringify(logEntry, null, 2), {
        metadata: {
          source: requestData.payload.source,
          summary: requestData.payload.summary,
          timestamp: timestamp
        }
      });
    }

    // Log for debugging (server-side only, visible in Cloudflare dashboard)
    console.log('Data submitted successfully:', {
      id: logEntry.id,
      source: requestData.payload.source
    });

    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('Submission error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Reject all non-POST requests
export async function onRequest(context) {
  if (context.request.method === 'POST') {
    return onRequestPost(context);
  }

  // Return 404 for any other method
  return new Response('Not Found', { status: 404 });
}
