import { Loading, Card, Button } from '@/components/common'
import { ProfileField } from './ProfileField'
import {EyeIcon, EyeOffIcon, LockIcon, MailIcon, UserIcon} from "lucide-react";
import {TrendIcon} from "@/features/user";
import { useMyInfo } from '@/features/user/hooks/useMyInfo'
import './MyInfoForm.css'

const ErrorIcon = () => (
    <svg className="myinfo-msg-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
)

const SuccessIcon = () => (
    <svg className="myinfo-msg-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
)

export const MyInfoForm = () => {
    const {
        nickname,
        setNickname,
        email,
        setEmail,
        password,
        setPassword,
        investmentTypeLabel,
        isSocialLogin,
        showPassword,
        togglePasswordVisibility,
        loading,
        saving,
        error,
        successMsg,
        handleSave,
        handleReset,
        handleLogout,
        handleWithdraw,
    } = useMyInfo()

    if (loading) {
        return (
            <div className="myinfo-container">
                <Card padding="large" className="myinfo-card">
                    <Loading size="medium" />
                </Card>
            </div>
        )
    }

    return (
        <div className="myinfo-container">
            <div className="myinfo-wrapper">
                <div className="myinfo-header">

                </div>

                <Card padding="large" className="myinfo-card">
                    <h3 className="myinfo-title">프로필 정보</h3>

                    {isSocialLogin ? (
                        /* 소셜 로그인 (KAKAO) */
                        <>
                            <ProfileField
                                icon={<MailIcon />}
                                label="이메일"
                                rightLabel="(소셜 로그인)"
                                inputWrapper={
                                    <div className="myinfo-social-badge">KAKAO</div>
                                }
                            />
                            <ProfileField
                                icon={<LockIcon />}
                                label="비밀번호"
                                rightLabel="(소셜 로그인)"
                                inputWrapper={
                                    <div className="myinfo-social-badge">
                                        소셜 로그인은 비밀번호가 필요하지 않습니다
                                    </div>
                                }
                            />
                        </>
                    ) : (
                        /* 로컬 로그인 (LOCAL) */
                        <>
                            <ProfileField
                                icon={<MailIcon />}
                                label="이메일"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            <ProfileField
                                icon={<LockIcon />}
                                label="비밀번호"
                                inputWrapper={
                                    <div className="myinfo-input-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="myinfo-input myinfo-input-with-icon"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="새로운 비밀번호를 입력해주세요"
                                        />
                                        <button
                                            type="button"
                                            className="myinfo-password-toggle"
                                            onClick={togglePasswordVisibility}
                                            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                }
                            />
                        </>
                    )}

                    <ProfileField
                        icon={<UserIcon />}
                        label="닉네임"
                        type="text"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                    />

                    <ProfileField
                        icon={<TrendIcon />}
                        label="투자 성향"
                        rightLabel="(Read Only)"
                        inputWrapper={
                            <div className="myinfo-propensity-badge">
                                {investmentTypeLabel}
                            </div>
                        }
                    />

                    {error && (
                        <div className="myinfo-message myinfo-message-error">
                            <ErrorIcon />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="myinfo-message myinfo-message-success">
                            <SuccessIcon />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <div className="myinfo-buttons">
                        <Button
                            variant="secondary"
                            onClick={handleReset}
                            className="myinfo-btn-reset"
                        >
                            되돌리기
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            loading={saving}
                            className="myinfo-btn-save"
                        >
                            저장하기
                        </Button>
                    </div>
                </Card>

                <div className="myinfo-account-actions">
                    <button
                        type="button"
                        className="myinfo-action-btn myinfo-action-logout"
                        onClick={handleLogout}
                    >
                        로그아웃
                    </button>
                    <span className="myinfo-action-divider">|</span>
                    <button
                        type="button"
                        className="myinfo-action-btn myinfo-action-withdraw"
                        onClick={handleWithdraw}
                    >
                        회원탈퇴
                    </button>
                </div>
            </div>
        </div>
    )
}
