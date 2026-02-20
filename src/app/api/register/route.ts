import { NextResponse } from 'next/server';

// Temporary in-memory store for IPs. 
// In production, use Redis or a database for persistence across server restarts.
const ipStore = new Set<string>();

export async function POST(request: Request) {
    try {
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        if (ip !== 'unknown' && ipStore.has(ip)) {
            return NextResponse.json(
                { message: 'Registration limit reached: One registration per IP address.' },
                { status: 429 }
            );
        }

        const data = await request.json();
        const { name, phone, societyName, itemType } = data;

        // Validate required fields
        if (!name || !societyName || !itemType) {
            return NextResponse.json(
                { message: 'Name, Society Name, and Item to rent are required fields.' },
                { status: 400 }
            );
        }

        // Here we push the form data to a Google Sheets Web App URL
        // You should define GOOGLE_SHEETS_WEBHOOK_URL in your .env.local file
        const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || '';

        if (GOOGLE_SHEETS_WEBHOOK_URL) {
            // Execute the fetch asynchronously without awaiting.
            // This drastically reduces user wait time on the confirmation page.
            fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    phone: phone || '',
                    societyName,
                    itemType,
                    timestamp: new Date().toISOString()
                }),
                redirect: 'follow', // Important for Google Apps Script redirects
            }).catch((error) => {
                console.error('Failed to submit to Google Sheets:', error);
            });
        } else {
            console.warn('Google Sheets Webhook URL not provided. Data is currently mocked/logged:', data);
        }

        // Mark IP as successfully registered
        if (ip !== 'unknown') {
            ipStore.add(ip);
        }

        return NextResponse.json({ message: 'Registration successful', success: true });

    } catch (error) {
        console.error('Registration API Error:', error);
        return NextResponse.json(
            { message: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
