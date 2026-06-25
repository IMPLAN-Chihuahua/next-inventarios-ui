import axios from 'axios'
import { getSession } from 'next-auth/react';

const baseURL = process.env.NEXT_PUBLIC_INVENTARIOS_BASE_URL

export const inventariosApi = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 20000,
});

export const setupMessageErrorFormatter = () => {
    inventariosApi.interceptors.response.use(
        res => res,
        error => {
            const message = (error.response &&
                error.response.data &&
                error.response.data.message) ||
                error.message || error.toString()
            return Promise.reject(message)
        }
    )
}


inventariosApi.interceptors.request.use(async (config) => {
    const session = await getSession();

    if (session?.user?.accessToken) {
        config.headers.Authorization = `Bearer ${session.user.accessToken}`;
    }
    return config;
});