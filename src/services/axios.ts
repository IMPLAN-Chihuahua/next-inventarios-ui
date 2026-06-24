import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_INVENTARIOS_BASE_URL

export const inventariosApi = axios.create({
    baseURL,
    headers:{
        'Content-Type':'application/json',
        'Accept':'application/json'
    },

});

