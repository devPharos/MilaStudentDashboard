import axios from 'axios';

import { parseCookies } from 'nookies';

const { 'mila-token': token } = parseCookies();

export const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
        'Authorization': `Bearer ${token}`
    }
})