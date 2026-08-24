"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { AlertCircle, ArrowLeft, Building2, Camera, CheckCircle2, Hash, Layers3, MapPin, Package, RefreshCw, ScanLine, ShieldCheck, Tag, UserRound, XCircle } from "lucide-react";
import styles from "./qr.module.css";

type NamedValue = string | { nombre?: string; tipo?: string; descripcion?: string } | null | undefined;
interface Articulo { _id?: string; id?: string; numeroInventario?: string; descripcion?: string; marca?: string; modelo?: string; noSerie?: string; estado?: string; localizacion?: string; categoria?: NamedValue; resguardante?: NamedValue; observaciones?: string; }
type ScreenState = "intro" | "scanning" | "loading" | "result" | "error";
const readerId = "inventory-qr-reader";
const named = (value: NamedValue, fallback: string) => !value ? fallback : typeof value === "string" ? value : value.nombre || value.tipo || value.descripcion || fallback;
const extractId = (raw: string) => { const value = raw.trim(); try { const url = new URL(value); return url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).at(-1) || value; } catch { return value; } };

export default function QrScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const [screen, setScreen] = useState<ScreenState>("intro");
  const [article, setArticle] = useState<Articulo | null>(null);
  const [message, setMessage] = useState("");

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try { if (scanner.isScanning) await scanner.stop(); scanner.clear(); } catch { /* El navegador ya cerró la cámara. */ }
  }, []);

  const loadArticle = useCallback(async (raw: string) => {
    const id = extractId(raw);
    if (!id || id.length > 120) { setMessage("La etiqueta escaneada no corresponde a un artículo válido."); setScreen("error"); processingRef.current = false; return; }
    setScreen("loading");
    try {
      const response = await fetch(`/api/v1/articulos/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (response.status === 404 || response.status === 422) throw new Error("No encontramos un artículo asociado a esta etiqueta.");
      if (!response.ok) throw new Error("No fue posible consultar el artículo. Intenta de nuevo.");
      const payload = (await response.json()) as Articulo | { data?: Articulo };
      const found = (payload as { data?: Articulo }).data ?? (payload as Articulo);
      if (!found) throw new Error("No encontramos un artículo asociado a esta etiqueta.");
      setArticle(found); setScreen("result");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Ocurrió un error al consultar el artículo."); setScreen("error"); }
    finally { processingRef.current = false; }
  }, []);

  const startScanner = useCallback(async () => {
    setArticle(null); setMessage(""); processingRef.current = false; setScreen("scanning");
    window.setTimeout(async () => {
      try {
        if (!window.isSecureContext) throw new Error("INSECURE_CONTEXT");
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMERA_API_UNAVAILABLE");
        await stopScanner();
        const scanner = new Html5Qrcode(readerId, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: (width, height) => { const size = Math.floor(Math.min(width, height) * .72); return { width: size, height: size }; } },
          async text => { if (processingRef.current) return; processingRef.current = true; await stopScanner(); await loadArticle(text); },
          () => undefined,
        );
      } catch (error) {
        await stopScanner();
        const errorText = error instanceof Error ? error.message : String(error);
        const denied = /permission|denied|notallowed/i.test(errorText);
        const insecure = errorText.includes("INSECURE_CONTEXT");
        const unavailable = errorText.includes("CAMERA_API_UNAVAILABLE");
        setMessage(insecure
          ? "La cámara está bloqueada porque esta página no tiene una conexión HTTPS válida. Escribir ‘https’ en una dirección HTTP no es suficiente."
          : unavailable
            ? "Este navegador no ofrece acceso a la cámara. Prueba con Safari en iPhone o Chrome en Android y evita abrir la página dentro de otra aplicación."
            : denied
              ? "No se permitió usar la cámara. Habilita el permiso de cámara para este sitio desde la configuración del navegador e intenta nuevamente."
              : `No pudimos iniciar la cámara${errorText ? ` (${errorText})` : ""}.`);
        setScreen("error");
      }
    }, 80);
  }, [loadArticle, stopScanner]);

  useEffect(() => () => { void stopScanner(); }, [stopScanner]);
  const reset = async () => { await stopScanner(); setArticle(null); setMessage(""); setScreen("intro"); };

  return <main className={styles.page}>
    <div className={styles.desktopNotice}><div className={styles.desktopIcon}><ScanLine size={34} /></div><h1>Lector disponible en dispositivos móviles</h1><p>Abre esta página desde un celular o una tableta para escanear etiquetas con la cámara.</p></div>
    <section className={styles.mobileApp}>
      <header className={styles.header}><div className={styles.brandMark}><Package size={23} /></div><div><span>Sistema de Inventarios</span><strong>Consulta por QR</strong></div><ShieldCheck className={styles.secureIcon} size={22} /></header>
      {screen === "intro" && <div className={styles.intro}>
        <div className={styles.heroVisual}><div className={styles.heroGlow} /><div className={styles.qrGlyph}><ScanLine size={72} strokeWidth={1.45} /></div><span className={styles.scanSweep} /></div>
        <div className={styles.introCopy}><span className={styles.eyebrow}>Consulta rápida</span><h1>Escanea la etiqueta del artículo</h1><p>Apunta la cámara al código QR para consultar la información registrada del bien.</p></div>
        <button className={styles.primaryButton} onClick={() => void startScanner()}><Camera size={20} /> Activar cámara</button><p className={styles.privacy}><ShieldCheck size={15} /> No necesitas iniciar sesión</p>
      </div>}
      {screen === "scanning" && <div className={styles.scannerScreen}>
        <div className={styles.screenTitle}><button aria-label="Regresar" onClick={() => void reset()}><ArrowLeft size={21} /></button><div><h1>Escanear etiqueta</h1><p>Coloca el QR dentro del recuadro</p></div></div>
        <div className={styles.cameraShell}><div id={readerId} className={styles.reader} /><div className={styles.cameraOverlay} aria-hidden="true"><i /><i /><i /><i /><span /></div></div>
        <div className={styles.scanHint}><ScanLine size={18} /> Mantén el dispositivo estable y con buena iluminación.</div>
      </div>}
      {screen === "loading" && <div className={styles.centerState}><div className={styles.loader}><ScanLine size={32} /></div><h1>Consultando artículo</h1><p>Estamos buscando la información de la etiqueta.</p></div>}
      {screen === "error" && <div className={styles.centerState}><div className={`${styles.stateIcon} ${styles.errorIcon}`}><XCircle size={38} /></div><h1>No pudimos completar la consulta</h1><p>{message}</p><button className={styles.primaryButton} onClick={() => void startScanner()}><RefreshCw size={18} /> Intentar de nuevo</button><button className={styles.textButton} onClick={() => void reset()}>Volver al inicio</button></div>}
      {screen === "result" && article && <div className={styles.resultScreen}>
        <div className={styles.successBanner}><CheckCircle2 size={22} /><div><strong>Artículo identificado</strong><span>Información registrada en el sistema</span></div></div>
        <article className={styles.articleCard}>
          <div className={styles.articleTop}><div className={styles.articleIcon}><Package size={27} /></div><div><span className={styles.inventoryLabel}>NÚMERO DE INVENTARIO</span><strong>{article.numeroInventario || "Sin número"}</strong></div></div>
          <h1>{article.descripcion || "Artículo sin descripción"}</h1><span className={styles.status}>{article.estado || "Sin estado"}</span>
          <div className={styles.detailList}><Detail icon={<Layers3 />} label="Categoría" value={named(article.categoria, "Sin categoría")} /><Detail icon={<UserRound />} label="Resguardante" value={named(article.resguardante, "Sin resguardante")} /><Detail icon={<MapPin />} label="Localización" value={article.localizacion || "No especificada"} /><Detail icon={<Tag />} label="Marca y modelo" value={[article.marca, article.modelo].filter(Boolean).join(" · ") || "No especificados"} /><Detail icon={<Hash />} label="Número de serie" value={article.noSerie || "No especificado"} /></div>
          {article.observaciones && <div className={styles.notes}><AlertCircle size={17} /><div><span>Observaciones</span><p>{article.observaciones}</p></div></div>}
        </article>
        <button className={styles.primaryButton} onClick={() => void startScanner()}><ScanLine size={19} /> Escanear otro artículo</button><button className={styles.textButton} onClick={() => void reset()}>Finalizar consulta</button>
      </div>}
      <footer className={styles.footer}><Building2 size={14} /> IMPLAN Chihuahua</footer>
    </section>
  </main>;
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className={styles.detail}><span className={styles.detailIcon}>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>; }

