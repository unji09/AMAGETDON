import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary, PrivateRoute, PublicRoute, AuthRoute, SurveyRoute } from '@/components/common';
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
import { LandingPage } from '@/pages/LandingPage';

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    {/* "/" 경로: 로그인 여부에 따라 다른 페이지 표시 */}
                    <Route path="/" element={
                        <AuthRoute
                            authenticatedComponent={<HomePage />}
                            unauthenticatedComponent={<LandingPage />}
                        />
                    } />

                    {/* Public Routes - 로그인 시 홈으로 리다이렉트 */}
                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                    <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
                    <Route path="/oauth/kakao" element={<OAuthKakaoCallback />} />
                    <Route path="/password-reset" element={<PublicRoute><PasswordResetPage /></PublicRoute>} />

                    {/* Private Routes - 로그인 필수 */}
                    <Route path="/learning/review-note" element={<PrivateRoute><ReviewNotePage /></PrivateRoute>} />
                    <Route path="/learning/quiz" element={<PrivateRoute><DailyQuizPage /></PrivateRoute>} />
                    <Route path="/learning/:chapterId/quiz" element={<PrivateRoute><ChapterQuizPage /></PrivateRoute>} />
                    <Route path="/learning/:chapterId" element={<PrivateRoute><ChapterDetailPage /></PrivateRoute>} />
                    <Route path="/learning" element={<PrivateRoute><LearningPage /></PrivateRoute>} />
                    <Route path="/achievement" element={<PrivateRoute><AchievementPage /></PrivateRoute>} />
                    <Route path="/investment" element={<PrivateRoute><InvestmentPage /></PrivateRoute>} />
                    <Route path="/investment/transactions" element={<PrivateRoute><TransactionPage /></PrivateRoute>} />
                    <Route path="/investment/holdings" element={<PrivateRoute><HoldingsPage /></PrivateRoute>} />
                    <Route path="/investment/watchlist" element={<PrivateRoute><WatchlistPage /></PrivateRoute>} />
                    <Route path="/investment/:stockCode" element={<PrivateRoute><StockDetailPage /></PrivateRoute>} />
                    <Route path="/community" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
                    <Route path="/community/chat/:roomId" element={<PrivateRoute><ChatRoomPage /></PrivateRoute>} />
                    <Route path="/ranking" element={<PrivateRoute><RankingPage /></PrivateRoute>} />
                    <Route path="/mypage" element={<PrivateRoute><MyInfoPage /></PrivateRoute>} />
                    <Route path="/survey" element={<SurveyRoute><SurveyPage /></SurveyRoute>} />
                    <Route path="/daily-quiz" element={<PrivateRoute><DailyQuizPage /></PrivateRoute>} />

                    {/* 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;