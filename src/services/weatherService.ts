export const obtenerClima = async (ciudad: string) => {
  const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  
  if (!API_KEY) {
    throw new Error("API Key no esta configurada");
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${ciudad}&lang=es`;
  
  const respuesta = await fetch(url);
  
  if (!respuesta.ok) {
    throw new Error("Error en la peticion");
  }
  
  return await respuesta.json();
};