import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Card } from '@/components/common'
import { useLogin } from '../hooks/login'
import {KakaoLoginButton} from "@/features/auth";
import './LoginForm.css'

const ErrorIcon = () => (
    <svg className="auth-error-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
)

const WarningIcon = () => (
    <svg className="auth-warning-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
)

// 에러 메시지 매핑
const getErrorDetails = (error: string) => {
    if (error.includes('비밀번호') || error.includes('password')) {
        return {
            title: '비밀번호 오류',
            message: '입력하신 비밀번호가 일치하지 않습니다. 다시 확인해주세요.'
        }
    }
    if (error.includes('이메일') || error.includes('email') || error.includes('존재하지')) {
        return {
            title: '계정을 찾을 수 없음',
            message: '입력하신 이메일로 등록된 계정이 없습니다. 이메일을 확인하거나 회원가입해주세요.'
        }
    }
    if (error.includes('네트워크') || error.includes('network') || error.includes('서버')) {
        return {
            title: '연결 오류',
            message: '서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
        }
    }
    return {
        title: '로그인 실패',
        message: error
    }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const LoginForm = () => {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { login, loading, error } = useLogin()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [touched, setTouched] = useState(false)
    const [sessionExpiredMsg] = useState(
        () => searchParams.get('expired') === 'true'
    )

    const isEmailValid = EMAIL_REGEX.test(email)
    const isValid = isEmailValid && password.trim() !== ''

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            navigate('/', { replace: true })
            return
        }

        // URL에서 expired 파라미터 제거 (알림은 이미 초기값으로 설정됨)
        if (searchParams.get('expired')) {
            const newParams = new URLSearchParams(searchParams)
            newParams.delete('expired')
            setSearchParams(newParams, { replace: true })
        }
    }, [navigate, searchParams, setSearchParams])

    const handleSubmit = async () => {
        setTouched(true)
        if (!isValid || loading) return

        try {
            const result = await login({ email, password })
            if (result.firstLogin) {
                navigate('/survey', { replace: true })
            } else {
                navigate('/', { replace: true })
            }
        } catch {
            // 에러는 hook에서 처리
        }
    }

    const errorDetails = error ? getErrorDetails(error) : null

    return (
        <div className="auth-container">
            <div className="auth-header">
                <img src="/logo.png" alt="AMAGETDON" className="auth-header-logo" />
                <span className="auth-header-title">AMAGETDON</span>
            </div>
            <Card className="auth-card">
                <h2 className="auth-card-title">로그인</h2>

                {sessionExpiredMsg && (
                    <div className="auth-warning-box">
                        <WarningIcon />
                        <p className="auth-warning-message">
                            세션이 만료되어 로그아웃되었습니다. 다시 로그인해주세요.
                        </p>
                    </div>
                )}

                {errorDetails && (
                    <div className="auth-error-box">
                        <ErrorIcon />
                        <div className="auth-error-content">
                            <p className="auth-error-title">{errorDetails.title}</p>
                            <p className="auth-error-message">{errorDetails.message}</p>
                        </div>
                    </div>
                )}

                {touched && !isValid && !error && (
                    <div className="auth-warning-box">
                        <WarningIcon />
                        <p className="auth-warning-message">
                            {!isEmailValid && email.trim() !== ''
                                ? '올바른 이메일 형식을 입력해주세요.'
                                : '이메일과 비밀번호를 모두 입력해주세요.'}
                        </p>
                    </div>
                )}
                <div className="auth-form">
                <Input
                    label="이메일"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                />


                <Input
                    label="비밀번호"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />

                <div className="auth-button-group">
                    <Button
                        type="button"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={!isValid || loading}
                        style={{ height: 48 }}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </Button>

                    <div className="auth-divider">
                        <span className="auth-divider-text">또는</span>
                    </div>

                    <KakaoLoginButton />
                </div>
                </div>
                <div className="auth-links">
                    <span className="auth-link" onClick={() => navigate('/password-reset')}>
                        비밀번호 찾기
                    </span>
                    <span className="auth-link" onClick={() => navigate('/signup')}>
                        회원가입
                    </span>
                </div>
            </Card>
        </div>
    )
}
