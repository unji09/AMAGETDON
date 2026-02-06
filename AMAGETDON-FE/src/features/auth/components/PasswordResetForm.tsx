import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '@/components/common'
import { usePasswordReset } from '../hooks/passwordReset'
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

const SuccessIcon = () => (
    <svg className="auth-success-icon-large" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
)

const getErrorDetails = (error: string) => {
    if (error.includes('존재하지') || error.includes('not found') || error.includes('없')) {
        return {
            title: '계정을 찾을 수 없음',
            message: '입력하신 이메일로 등록된 계정이 없습니다. 이메일을 다시 확인해주세요.'
        }
    }
    if (error.includes('형식') || error.includes('format')) {
        return {
            title: '이메일 형식 오류',
            message: '올바른 이메일 형식을 입력해주세요.'
        }
    }
    return {
        title: '전송 실패',
        message: error
    }
}

export const PasswordResetForm = () => {
    const navigate = useNavigate()
    const { sendResetEmail, loading, error, success } = usePasswordReset()

    const [email, setEmail] = useState('')
    const [touched, setTouched] = useState(false)

    const isValid = email.trim() !== ''

    const handleSubmit = async () => {
        setTouched(true)
        if (!isValid || loading) return

        try {
            await sendResetEmail(email)
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
                <h2 className="auth-card-title">비밀번호 찾기</h2>

                {!success ? (
                    <>
                        <p className="auth-description">
                            가입하신 이메일 주소를 입력하시면<br />
                            임시 비밀번호 보내드립니다
                        </p>

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
                                <p className="auth-warning-message">이메일을 입력해주세요.</p>
                            </div>
                        )}

                        <Input
                            label="이메일"
                            placeholder="example@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onBlur={() => setTouched(true)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />

                        <div className="auth-button-group">
                            <Button
                                fullWidth
                                onClick={handleSubmit}
                                disabled={!isValid || loading}
                                style={{ height: 48 }}
                            >
                                {loading ? '전송 중...' : '재설정 링크 보내기'}
                            </Button>
                        </div>

                        <div className="auth-link-center">
                            <span className="auth-link-highlight" onClick={() => navigate('/login')}>
                                로그인으로 돌아가기
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="auth-success-box">
                        <div className="auth-success-icon-wrapper">
                            <SuccessIcon />
                        </div>
                        <p className="auth-success-title">메일이 전송되었습니다</p>
                        <p className="auth-success-message">
                            입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다.<br />
                            메일함을 확인해주세요.
                        </p>
                        <div className="auth-button-group">
                            <Button
                                fullWidth
                                style={{ height: 48 }}
                                onClick={() => navigate('/login')}
                            >
                                로그인 화면으로
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
