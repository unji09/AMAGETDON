import { Loading } from '@/components/common'
import { INVESTMENT_TYPE_CONFIG } from '@/constants/investmentType'

import './HomeContent.css'
import {useHome} from "@/features/home";

export const HomeContent = () => {
    const {
        userData,
        achievements,
        progressData,
        loading,
        quizStreak,
        rankingData,
        navigateToMyInfo,
        navigateToRanking,
        navigateToAchievement,
        navigateToDailyQuiz,
        navigateToLearning,
    } = useHome()

    if (loading || !userData) {
        return (
            <div className="home-container">
                <div className="home-loading">
                    <Loading size="medium" />
                </div>
            </div>
        )
    }

    const formatBalance = (balance: number) => {
        return balance.toLocaleString()
    }

    // 랭킹 퍼센트 계산 (상위 몇 %)
    const getRankPercentage = (rank: number, total: number) => {
        if (total === 0 || rank === 0) return null
        const percentage = Math.ceil((rank / total) * 100)
        return Math.min(percentage, 100)
    }

    // 현재 칭호에 해당하는 업적 아이콘 찾기
    const getProfileIcon = () => {
        if (!userData.currentTitle) return null
        const matchedAchievement = achievements.find(
            (a) => a.achievementName === userData.currentTitle && a.isAchieved && a.achievementIcon
        )
        return matchedAchievement?.achievementIcon || null
    }

    const profileIcon = getProfileIcon()

    // 수익 랭킹 표시 문자열
    const getProfitRankDisplay = () => {
        const { profitRank, totalProfitUsers } = rankingData
        if (!profitRank) return '랭킹 없음'

        const percentage = getRankPercentage(profitRank.rank, totalProfitUsers)
        if (percentage) {
            return `상위 ${percentage}% / ${profitRank.rank.toLocaleString()}위`
        }
        return `${profitRank.rank.toLocaleString()}위`
    }

    return (
        <div className="home-container">
            {/* User Profile Card */}
            <div className="home-profile-card card-hover">
                <div className="home-profile-left">
                    <div className="home-profile-image">
                        <div className={`home-avatar ${profileIcon ? 'home-avatar--achievement' : ''}`}>
                            <img
                                src={profileIcon || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%23f8d7da'/%3E%3Cpath d='M25 65 Q25 45 50 45 Q75 45 75 65 L75 100 L25 100 Z' fill='%234a5568'/%3E%3C/svg%3E"}
                                alt="Profile"
                            />
                        </div>
                    </div>

                    <div className="home-profile-info">
                        <h2 className="home-nickname">{userData.nickname}</h2>
                        <div className="home-title-row">
                            <p className="home-title">{userData.currentTitle || '칭호 없음'}</p>
                            {userData.investmentType && (
                                <span
                                    className="home-investment-type"
                                    style={{ color: INVESTMENT_TYPE_CONFIG[userData.investmentType].color }}
                                >
                                    {INVESTMENT_TYPE_CONFIG[userData.investmentType].icon} {INVESTMENT_TYPE_CONFIG[userData.investmentType].label}
                                </span>
                            )}
                        </div>
                        <div className="home-profile-buttons">
                            <button
                                className="home-btn home-btn-edit"
                                onClick={navigateToMyInfo}
                            >
                                내 정보 수정
                            </button>
                            <button
                                className="home-btn home-btn-ranking"
                                onClick={navigateToRanking}
                            >
                                랭킹 보기
                            </button>
                        </div>
                    </div>
                </div>

                <div className="home-profile-stats">
                    <div className="home-stats-rank">{getProfitRankDisplay()}</div>
                    <div className="home-stats-balance">
                        {formatBalance(userData.balance)} <span className="home-stats-unit">원</span>
                    </div>
                </div>
            </div>

            {/* Quiz Streak Card */}
            <div className="home-streak-card glow-effect">
                <div className="home-streak-bg-1" />
                <div className="home-streak-bg-2" />

                <div className="home-streak-content">
                    <h3 className="home-streak-title">
                        오늘의 학습이<br />
                        내일의 투자 실력이 됩니다.
                    </h3>

                    <div className="home-streak-stats">
                        <div className="home-streak-label">오늘 푼 문제 수</div>
                        <div className="home-streak-number streak-number">{quizStreak}</div>
                    </div>
                </div>

                <button
                    className="home-cta-button cta-button"
                    onClick={navigateToDailyQuiz}
                >
                    🔥 무한 퀴즈 지옥 입장하기 →
                </button>
            </div>

            {/* Stats Grid */}
            <div className="home-stats-grid">
                {/* 커리큘럼 Card */}
                <div
                    className="home-curriculum-card card-hover"
                    onClick={navigateToLearning}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="home-card-header">
                        <div className="home-card-title">
                            <span>📚</span>
                            <h4>커리큘럼</h4>
                        </div>
                        <span className="home-achievement-badge">
                            {progressData ? `${progressData.percentage}% 달성` : '로딩중...'}
                        </span>
                    </div>

                    <div className="home-curriculum-content">
                        <div className="home-curriculum-icon">📊</div>
                        <div className="home-curriculum-info">
                            <div className="home-curriculum-name">
                                {progressData?.nextChapter?.chapterTitle ?? '모든 학습 완료!'}
                            </div>
                            <div className="home-curriculum-chapter">
                                Chapter {progressData?.completedChapters ?? 0} / {progressData?.totalChapters ?? 0}
                            </div>
                            <div className="home-progress-bar">
                                <div
                                    className="home-progress-fill progress-fill"
                                    style={{ width: `${progressData?.percentage ?? 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 오답노트 Card */}
                <div className="home-wrong-answers-card card-hover">
                    <div className="home-wrong-header">
                        <div className="home-wrong-title">
                            <svg className="home-wrong-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6H20M4 12H20M4 18H12" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M16 16L20 20M20 16L16 20" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <h4>오답노트</h4>
                        </div>
                        <span className="home-wrong-arrow">›</span>
                    </div>

                    <div className="home-wrong-answers-content">
                        <div className="home-wrong-count">13문제</div>
                        <div className="home-wrong-desc">다시 풀어볼 문항이 있습니다</div>
                    </div>
                </div>
            </div>

            {/* 내 업적 Section */}
            <div className="home-achievements-card card-hover">
                <div className="home-achievements-header">
                    <div className="home-card-title">
                        <span>💡</span>
                        <h4>내 업적</h4>
                    </div>
                    <button
                        className="home-achievements-detail"
                        onClick={navigateToAchievement}
                    >
                        상세보기
                    </button>
                </div>

                <div className="home-achievements-grid">
                    {[...achievements].sort((a, b) => Number(b.isAchieved) - Number(a.isAchieved)).slice(0, 7).map((achievement) => (
                        <div
                            key={achievement.achievementId}
                            className={`home-achievement-item achievement-badge ${!achievement.isAchieved ? 'locked' : 'tooltip'}`}
                            {...(achievement.isAchieved && { 'data-tooltip': achievement.achievementName })}
                        >
                            {achievement.isAchieved && achievement.achievementIcon ? (
                                <img
                                    src={achievement.achievementIcon}
                                    alt={achievement.achievementName}
                                    className="home-achievement-icon-img"
                                />
                            ) : (
                                <svg className="home-lock-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
