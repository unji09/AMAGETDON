import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common';
import { HomePage } from '@/pages/HomePage';
import { CommunityPage } from '@/pages/CommunityPage';
import { RankingPage } from '@/pages/RankingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import LoginPage from "@/pages/LoginPage.tsx";
import OAuthKakaoCallback from "./pages/OAuthKakaoCallback";
import { LearningPage } from '@/pages/LearningPage';
import { ChapterDetailPage } from '@/pages/ChapterDetailPage';
import { AchievementPage } from '@/pages/AchievementPage';
import ChatRoomPage from '@/pages/ChatRoomPage';
import SignupPage from "@/pages/SignupPage.tsx";
import PasswordResetPage from "@/pages/PasswordResetPage.tsx";
import MyInfoPage from "@/pages/MyInfoPage.tsx";
import SurveyPage from "@/pages/SurveyPage.tsx";
import { DailyQuizPage } from '@/pages/DailyQuizPage';
import { ChapterQuizPage } from '@/pages/ChapterQuizPage';
import '@/api/interceptor'
import { InvestmentPage } from '@/pages/InvestmentPage';
import { StockDetailPage } from '@/pages/StockDetailPage';
import { TransactionPage } from '@/pages/TransactionPage';
import { HoldingsPage } from '@/pages/HoldingsPage';
import { WatchlistPage } from '@/pages/WatchlistPage';
import { ReviewNotePage } from '@/pages/ReviewNotePage';
// import { LandingPage } from '@/pages/LandingPage';

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    {/* <Route path="/" element={<LandingPage />} /> */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/learning/review-note" element={<ReviewNotePage />} />
                    <Route path="/learning/quiz" element={<DailyQuizPage />} />
                    <Route path="/learning/:chapterId/quiz" element={<ChapterQuizPage />} />
                    <Route path="/learning/:chapterId" element={<ChapterDetailPage />} />
                    <Route path="/learning" element={<LearningPage />} />
                    <Route path="/achievement" element={<AchievementPage />} />
                    <Route path="/investment" element={<InvestmentPage />} />
                    <Route path="/investment/transactions" element={<TransactionPage />} />
                    <Route path="/investment/holdings" element={<HoldingsPage />} />
                    <Route path="/investment/watchlist" element={<WatchlistPage />} />
                    <Route path="/investment/:stockCode" element={<StockDetailPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/community/chat/:roomId" element={<ChatRoomPage />} />
                    <Route path="/ranking" element={<RankingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/oauth/kakao" element={<OAuthKakaoCallback />} />
                    <Route path="/password-reset" element={<PasswordResetPage />} />
                    <Route path="/mypage" element={<MyInfoPage />} />
                    <Route path="/survey" element={<SurveyPage />} />
                    <Route path="/daily-quiz" element={<DailyQuizPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;