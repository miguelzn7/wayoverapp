
import axios from 'axios';

export const createInvoice = async ({ amount, email, itemName }) => {
    try {
        const response = await axios.post('http://localhost:3001/create-invoice', {
            amount,
            email,
            itemName,
        });
        return response.data.invoice_url;
    } catch (error) {
        console.error('Payment Error:', error);
        throw error;
    }
};
