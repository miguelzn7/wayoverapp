
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

app.post('/create-invoice', async (req, res) => {
    try {
        const { amount, email, itemName } = req.body;

        if (!amount || !email) {
            return res.status(400).json({ error: 'Amount and email are required' });
        }

        // Convert USD to IDR (Fixed rate: 15,500)
        const amountIDR = Math.round(amount * 15500);

        const timestamp = Date.now();
        const externalId = `wayover-${timestamp}`;

        // Xendit API requires the secret key as the username for Basic Auth
        // The password remains empty
        const secretKey = process.env.XENDIT_IN_API_KEY;

        if (!secretKey) {
            console.error('Xendit Secret Key is missing!');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const authString = Buffer.from(secretKey + ':').toString('base64');

        const response = await axios.post(
            'https://api.xendit.co/v2/invoices',
            {
                external_id: externalId,
                amount: amountIDR,
                payer_email: email,
                description: `Payment for ${itemName || 'Item'}`,
                success_redirect_url: 'http://localhost:5173/',
                currency: 'IDR' // Sandbox works best with IDR usually, but we converted anyway
            },
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({ invoice_url: response.data.invoice_url });
    } catch (error) {
        console.error('Error creating invoice:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
