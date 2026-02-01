// src/features/auth/pages/PasswordResetPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '@/components/common'
import {usePasswordReset} from "@/features/auth/hooks/passwordReset.ts";

export default function PasswordResetPage() {
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

    return (
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 80 }}>
            <Card>
                <h2 style={{ marginBottom: 12 }}>비밀번호 찾기</h2>

                <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
                    가입하신 이메일 주소를 입력하시면
                    비밀번호 재설정 링크를 보내드립니다.
                </p>

                {!success && (
                    <>
                        <Input
                            label="이메일"
                            placeholder="example@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onBlur={() => setTouched(true)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />

                        {touched && !isValid && (
                            <p style={{ color: 'red', marginTop: 8 }}>
                                이메일을 입력해주세요.
                            </p>
                        )}

                        {error && (
                            <p style={{ color: 'red', marginTop: 8 }}>
                                {error}
                            </p>
                        )}

                        <Button
                            fullWidth
                            onClick={handleSubmit}
                            disabled={!isValid || loading}
                            style={{ marginTop: 24 }}
                        >
                            {loading ? '전송 중...' : '비밀번호 재설정 메일 보내기'}
                        </Button>
                    </>
                )}

                {success && (
                    <>
                        <p style={{ marginTop: 16, lineHeight: 1.6 }}>
                            입력하신 이메일로
                            <strong> 비밀번호 재설정 링크</strong>를 보냈습니다.
                            <br />
                            메일함을 확인해주세요.
                        </p>

                        <Button
                            fullWidth
                            style={{ marginTop: 24 }}
                            onClick={() => navigate('/login')}
                        >
                            로그인 화면으로 돌아가기
                        </Button>
                    </>
                )}
            </Card>
        </div>
    )
}
