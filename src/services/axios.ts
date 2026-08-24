import axios from 'axios'
import { getSession, signOut } from 'next-auth/react';

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
let redirectingToLogin = false;

inventariosApi.interceptors.response.use(
    response => response,
    async error => {
        const status = error?.response?.status;
        const message = error?.response?.data?.message;
        const authenticationExpired =
            status === 401 ||
            (status === 403 && message === 'JWT es inválido o ha expirado');

        if (
            typeof window !== 'undefined' &&
            authenticationExpired &&
            !redirectingToLogin
        ) {
            redirectingToLogin = true;
            await signOut({ callbackUrl: '/login' });
        }

        return Promise.reject(error);
    }
);

