// ফাইল: netlify/functions/fcm_notifier.js

const fetch = require('node-fetch');

// This should be an environment variable
// For local development, you can use a .env file with this variable.
// In Netlify, set this in the build & deploy environment variables.
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || 'BG07gtUq0oYXoUHPvOQNxs5-fri-4TsCCkvcK2QdWFpXk_OYVs4uv3IguNNcxSHi-pjSgR03ULlup5IHkJzgCso';

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid JSON format.' }) };
    }

    const { fcmToken, title, body, click_action } = data;

    if (!fcmToken || !title || !body) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing required fields: fcmToken, title, body' }) };
    }

    const message = {
        to: fcmToken,
        notification: {
            title: title,
            body: body,
            icon: '/images/logo-192.png'
        },
        data: {
            click_action: click_action || '/'
        }
    };

    try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${FCM_SERVER_KEY}`
            },
            body: JSON.stringify(message)
        });

        const responseData = await response.json();

        if (response.ok && responseData.success === 1) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Notification sent successfully!', fcm_response: responseData })
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ success: false, message: 'Failed to send FCM notification.', error: responseData.results || 'Unknown FCM error' })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Internal server error during API call.', error: error.message })
        };
    }
};
