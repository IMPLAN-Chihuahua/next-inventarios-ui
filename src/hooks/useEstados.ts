"use client";
import { useEffect, useState } from "react";
import { inventariosApi } from "@/src/services/axios";
const DEFAULT_ESTADOS = ["Asignado", "Baja", "Donado", "Dictaminar", "Dictaminado"];
export function useEstados() {
  const [estados, setEstados] = useState<string[]>(DEFAULT_ESTADOS);
  useEffect(() => {
    let active = true;
    inventariosApi.get("/estados").then((response) => {
      const data = Array.isArray(response.data) ? response.data : response.data?.data;
      const nombres = Array.isArray(data) ? data.map((item: { nombre?: string }) => item.nombre).filter(Boolean) as string[] : [];
      if (active && nombres.length) setEstados(nombres);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return estados;
}
