
/**
 * Service to trigger external webhooks (e.g., n8n, Zapier, Make)
 * Useful for automation flows when visits are created or updated.
 */

export const triggerWebhook = async (event: string, payload: any) => {
  // ⚠️ Replace with your actual n8n or Zapier Webhook URL if needed
  const WEBHOOK_URL = ''; 
  
  if (!WEBHOOK_URL) {
    // Log to console for debugging if no URL is set
    console.log(`[Webhook Triggered] Event: ${event}`, payload);
    return;
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event, 
        timestamp: new Date().toISOString(),
        data: payload 
      })
    });
  } catch (error) {
    console.error('Webhook trigger failed:', error);
  }
};
