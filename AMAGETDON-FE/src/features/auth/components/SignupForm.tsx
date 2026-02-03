import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '@/components/common'
import { useSignup } from '../hooks/signup'
import './LoginForm.css'
import {KakaoLoginButton} from "@/features/auth";

const ErrorIcon = () => (
    <svg className="auth-error-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
)

const CheckIcon = () => (
    <svg className="auth-password-status-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
)

const XIcon = () => (
    <svg className="auth-password-status-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
)

const WarningIcon = () => (
    <svg className="auth-warning-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
)

const getErrorDetails = (error: string) => {
    if (error.includes('이미') || error.includes('exist') || error.includes('duplicate')) {
        return {
            title: '이메일 중복',
            message: '이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해주세요.'
        }
    }
    if (error.includes('형식') || error.includes('format') || error.includes('invalid')) {
        return {
            title: '입력 형식 오류',
            message: '이메일 형식이 올바르지 않습니다. 올바른 이메일 주소를 입력해주세요.'
        }
    }
    return {
        title: '회원가입 실패',
        message: error
    }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const SignupForm = () => {
    const navigate = useNavigate()
    const { signup, loading, error } = useSignup()

    const [form, setForm] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        nickname: '',
    })
    const [touched, setTouched] = useState(false)

    const handleChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    const isEmailValid = EMAIL_REGEX.test(form.email)

    const isPasswordMatch =
        form.password !== '' &&
        form.password === form.passwordConfirm

    const showPasswordStatus =
        form.password !== '' && form.passwordConfirm !== ''

    const isValid =
        isEmailValid &&
        form.password.trim() !== '' &&
        form.passwordConfirm.trim() !== '' &&
        form.nickname.trim() !== '' &&
        isPasswordMatch

    // 경고 메시지 결정
    const getWarningMessage = () => {
        if (!isEmailValid) return '올바른 이메일 형식을 입력해주세요.'
        return null
    }

    const handleSubmit = async () => {
        setTouched(true)
        if (!isValid || loading) return

        try {
            const result = await signup({
                email: form.email,
                password: form.password,
                nickname: form.nickname,
            })
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
                <h2 className="auth-card-title">회원가입</h2>

                {errorDetails && (
                    <div className="auth-error-box">
                        <ErrorIcon />
                        <div className="auth-error-content">
                            <p className="auth-error-title">{errorDetails.title}</p>
                            <p className="auth-error-message">{errorDetails.message}</p>
                        </div>
                    </div>
                )}

                {touched && !isValid && !error && getWarningMessage() && (
                    <div className="auth-warning-box">
                        <WarningIcon />
                        <p className="auth-warning-message">{getWarningMessage()}</p>
                    </div>
                )}

                <div className="auth-form">
                <Input
                    label="이메일"
                    type="email"
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    onBlur={() => setTouched(true)}
                />

                <Input
                    label="비밀번호"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={form.password}
                    onChange={e => handleChange('password', e.target.value)}
                />

                <Input
                    label="비밀번호 확인"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={form.passwordConfirm}
                    onChange={e => handleChange('passwordConfirm', e.target.value)}
                />

                {showPasswordStatus && (
                    <div className={`auth-password-status ${isPasswordMatch ? 'match' : 'mismatch'}`}>
                        {isPasswordMatch ? <CheckIcon /> : <XIcon />}
                        <span>{isPasswordMatch ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}</span>
                    </div>
                )}

                <Input
                    label="닉네임"
                    placeholder="사용할 닉네임"
                    value={form.nickname}
                    onChange={e => handleChange('nickname', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />

                <div className="auth-button-group">
                    <Button
                        fullWidth
                        onClick={handleSubmit}
                        disabled={!isValid || loading}
                        style={{ height: 48 }}
                    >
                        {loading ? '회원가입 중...' : '회원가입'}
                    </Button>

                    <div className="auth-divider">
                        <span className="auth-divider-text">또는</span>
                    </div>

                    <KakaoLoginButton />
                </div>
                </div>

                <div className="auth-link-center">
                    이미 계정이 있으신가요?
                    <span className="auth-link-highlight" onClick={() => navigate('/login')}>
                        로그인
                    </span>
                </div>
            </Card>
        </div>
    )
}
