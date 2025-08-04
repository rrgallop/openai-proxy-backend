export default async function handler(req, res) {
    // --- CORS headers (for prototype; lock down origin in production) ---
    res.setHeader('Access-Control-Allow-Origin', '*'); // or replace '*' with your frontend origin
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid messages' });
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error('Missing OPENAI_API_KEY');
        return res.status(500).json({ error: 'Server misconfigured' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages,
                max_tokens: 200
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(errorText);
            return res.status(response.status).json({ error: 'Failed to generate response', details: errorText });
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content || '';

        res.status(200).json({ reply });
        
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate response' });
    }


}

