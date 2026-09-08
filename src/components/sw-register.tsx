"use client";

import { useEffect } from "react";

// Sem isso, o Chrome/Android trata o site como uma página comum e só
// oferece "adicionar atalho" — o Service Worker é obrigatório pro
// navegador considerar o app instalável de verdade (ícone próprio,
// abre em janela separada, some a barra de endereço).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
