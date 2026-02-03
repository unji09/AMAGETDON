import { useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Users, Shield, ChevronRight, BarChart3, Target, Zap } from 'lucide-react';
import './LandingPage.css';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing">
            {/* Hero Section */}
            <section className="landing__hero">
                <div className="landing__hero-bg">
                    <div className="landing__hero-gradient" />
                    <div className="landing__hero-grid" />
                </div>
                <nav className="landing__nav">
                    <div className="landing__logo">
                        <TrendingUp size={32} />
                        <span>AMAGETDON</span>
                    </div>
                    <div className="landing__nav-buttons">
                        <button className="landing__nav-login" onClick={() => navigate('/login')}>
                            로그인
                        </button>
                        <button className="landing__nav-signup" onClick={() => navigate('/signup')}>
                            무료로 시작하기
                        </button>
                    </div>
                </nav>
                <div className="landing__hero-content">
                    <div className="landing__hero-badge">
                        <Zap size={14} />
                        <span>10,000명이 선택한 투자 교육 플랫폼</span>
                    </div>
                    <h1 className="landing__hero-title">
                        투자, 이제<br />
                        <span className="landing__hero-highlight">제대로</span> 배우세요
                    </h1>
                    <p className="landing__hero-subtitle">
                        실전처럼 배우고, 안전하게 연습하세요.<br />
                        가상 투자로 시작하는 당신만의 투자 여정.
                    </p>
                    <div className="landing__hero-cta">
                        <button className="landing__cta-primary" onClick={() => navigate('/signup')}>
                            지금 무료로 시작하기
                            <ChevronRight size={20} />
                        </button>
                        <button className="landing__cta-secondary" onClick={() => navigate('/login')}>
                            이미 계정이 있어요
                        </button>
                    </div>
                    <div className="landing__hero-stats">
                        <div className="landing__stat">
                            <strong>1,000만+</strong>
                            <span>가상 거래</span>
                        </div>
                        <div className="landing__stat-divider" />
                        <div className="landing__stat">
                            <strong>50+</strong>
                            <span>학습 챕터</span>
                        </div>
                        <div className="landing__stat-divider" />
                        <div className="landing__stat">
                            <strong>4.9</strong>
                            <span>사용자 평점</span>
                        </div>
                    </div>
                </div>
                <div className="landing__scroll-indicator">
                    <div className="landing__scroll-mouse">
                        <div className="landing__scroll-wheel" />
                    </div>
                    <span>스크롤하여 더 알아보기</span>
                </div>
                <div className="landing__hero-visual">
                    <div className="landing__phone-mockup">
                        <div className="landing__phone-screen">
                            <div className="landing__phone-header">
                                <span>삼성전자</span>
                                <span className="landing__phone-price">75,400원</span>
                            </div>
                            <div className="landing__phone-chart">
                                <svg viewBox="0 0 200 80" className="landing__chart-svg">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M0,60 Q30,55 50,40 T100,35 T150,20 T200,25"
                                        fill="none"
                                        stroke="#10B981"
                                        strokeWidth="2"
                                    />
                                    <path
                                        d="M0,60 Q30,55 50,40 T100,35 T150,20 T200,25 V80 H0 Z"
                                        fill="url(#chartGradient)"
                                    />
                                </svg>
                            </div>
                            <div className="landing__phone-stats">
                                <div className="landing__phone-stat">
                                    <span>수익률</span>
                                    <strong className="landing__phone-stat--up">+12.5%</strong>
                                </div>
                                <div className="landing__phone-stat">
                                    <span>보유수량</span>
                                    <strong>50주</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="landing__floating-card landing__floating-card--1">
                        <BarChart3 size={20} />
                        <span>실시간 시세</span>
                    </div>
                    <div className="landing__floating-card landing__floating-card--2">
                        <Target size={20} />
                        <span>목표 달성!</span>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing__features">
                <div className="landing__section-header">
                    <span className="landing__section-badge">Features</span>
                    <h2 className="landing__section-title">
                        왜 <span>AMAGETDON</span>일까요?
                    </h2>
                    <p className="landing__section-subtitle">
                        처음 투자를 배우는 분들을 위해 설계된 완벽한 학습 환경
                    </p>
                </div>
                <div className="landing__features-grid">
                    <div className="landing__feature-card">
                        <div className="landing__feature-icon landing__feature-icon--green">
                            <BookOpen size={24} />
                        </div>
                        <h3>체계적인 학습 커리큘럼</h3>
                        <p>기초부터 심화까지, 단계별로 설계된 50개 이상의 학습 챕터로 투자의 모든 것을 배워보세요.</p>
                    </div>
                    <div className="landing__feature-card">
                        <div className="landing__feature-icon landing__feature-icon--blue">
                            <TrendingUp size={24} />
                        </div>
                        <h3>실전 모의 투자</h3>
                        <p>실제 시장 데이터를 기반으로 가상 자금으로 매매 연습. 리스크 없이 실력을 쌓으세요.</p>
                    </div>
                    <div className="landing__feature-card">
                        <div className="landing__feature-icon landing__feature-icon--purple">
                            <Users size={24} />
                        </div>
                        <h3>커뮤니티 & 스터디</h3>
                        <p>같은 목표를 가진 동료들과 함께 성장하세요. 화상 스터디와 채팅으로 소통해요.</p>
                    </div>
                    <div className="landing__feature-card">
                        <div className="landing__feature-icon landing__feature-icon--orange">
                            <Shield size={24} />
                        </div>
                        <h3>안전한 학습 환경</h3>
                        <p>실제 돈 한 푼 없이 투자를 경험하세요. 실수해도 괜찮아요, 여기선 배움이 되니까요.</p>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="landing__how">
                <div className="landing__section-header">
                    <span className="landing__section-badge">How it works</span>
                    <h2 className="landing__section-title">
                        3단계로 시작하는<br /><span>투자 마스터</span> 여정
                    </h2>
                </div>
                <div className="landing__how-steps">
                    <div className="landing__how-step">
                        <div className="landing__step-number">Step 01</div>
                        <h3>학습하기</h3>
                        <p>기초 개념부터 차근차근. 퀴즈로 내 실력을 확인하세요.</p>
                    </div>
                    <div className="landing__how-connector" />
                    <div className="landing__how-step">
                        <div className="landing__step-number">Step 02</div>
                        <h3>연습하기</h3>
                        <p>1,000만원 가상 자금으로 실전처럼 매매 연습을 시작하세요.</p>
                    </div>
                    <div className="landing__how-connector" />
                    <div className="landing__how-step">
                        <div className="landing__step-number">Step 03</div>
                        <h3>성장하기</h3>
                        <p>성과를 분석하고, 업적을 달성하며 투자 실력을 키워가세요.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section + Footer */}
            <section className="landing__final-section">
                <div className="landing__cta-section">
                    <div className="landing__cta-content">
                        <h2>투자 공부, 더 이상 미루지 마세요</h2>
                        <p>지금 가입하면 1,000만원 가상 자금이 즉시 지급됩니다</p>
                        <button className="landing__cta-primary landing__cta-primary--large" onClick={() => navigate('/signup')}>
                            무료로 시작하기
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
                <footer className="landing__footer">
                <div className="landing__footer-content">
                    <div className="landing__footer-brand">
                        <div className="landing__logo">
                            <TrendingUp size={24} />
                            <span>AMAGETDON</span>
                        </div>
                        <p>투자 교육의 새로운 기준</p>
                    </div>
                    <div className="landing__footer-links">
                        <div className="landing__footer-column">
                            <h4>서비스</h4>
                            <a href="#">학습하기</a>
                            <a href="#">모의투자</a>
                            <a href="#">커뮤니티</a>
                        </div>
                        <div className="landing__footer-column">
                            <h4>회사</h4>
                            <a href="#">소개</a>
                            <a href="#">블로그</a>
                            <a href="#">채용</a>
                        </div>
                        <div className="landing__footer-column">
                            <h4>지원</h4>
                            <a href="#">FAQ</a>
                            <a href="#">문의하기</a>
                            <a href="#">이용약관</a>
                        </div>
                    </div>
                </div>
                <div className="landing__footer-bottom">
                    <p>© 2024 AMAGETDON. All rights reserved.</p>
                </div>
                </footer>
            </section>
        </div>
    );
};
