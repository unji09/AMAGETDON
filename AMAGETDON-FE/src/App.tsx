import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common';
import { HomePage } from '@/pages/HomePage';
import { CommunityPage } from '@/pages/CommunityPage';
import { RankingPage } from '@/pages/RankingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import {LoginPage} from "@/pages/LoginPage.tsx";
import OAuthKakaoCallback from "./pages/OAuthKakaoCallback";

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/ranking" element={<RankingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/oauth/kakao" element={<OAuthKakaoCallback />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;