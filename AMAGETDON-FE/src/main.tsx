import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'

interface KakaoInitSDK {
    init: (key: string) => void;
    isInitialized: () => boolean;
}

if (window.Kakao) {
    const kakao = window.Kakao as KakaoInitSDK;

    if (!kakao.isInitialized()) {
        kakao.init(import.meta.env.VITE_KAKAO_JS_KEY);
    }
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
