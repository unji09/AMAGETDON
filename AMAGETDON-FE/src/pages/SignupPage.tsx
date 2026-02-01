// src/features/auth/pages/SignupPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '@/components/common'
import {useSignup} from "@/features/auth/hooks/signup.ts";


export default function SignupPage() {
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

    const isPasswordMatch =
        form.password !== '' &&
        form.password === form.passwordConfirm

    const isValid =
        form.email.trim() !== '' &&
        form.password.trim() !== '' &&
        form.passwordConfirm.trim() !== '' &&
        form.nickname.trim() !== '' &&
        isPasswordMatch

    const handleSubmit = async () => {
        setTouched(true)
        if (!isValid || loading) return

        try {
            await signup({
                email: form.email,
                password: form.password,
                nickname: form.nickname,
            })
            navigate('/')
        } catch {
            // 에러는 hook에서 처리
        }
    }

    return (
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 80 }}>
            <Card>
                <h2 style={{ marginBottom: 24 }}>회원가입</h2>

                <Input
                    label="이메일"
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

                {touched && !isPasswordMatch && (
                    <p style={{ color: 'red', marginTop: 8 }}>
                        비밀번호가 일치하지 않습니다.
                    </p>
                )}

                <Input
                    label="닉네임"
                    placeholder="사용할 닉네임"
                    value={form.nickname}
                    onChange={e => handleChange('nickname', e.target.value)}
                />

                {touched && !isValid && !error && (
                    <p style={{ color: 'red', marginTop: 8 }}>
                        모든 항목을 올바르게 입력해주세요.
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
                    {loading ? '회원가입 중...' : '회원가입'}
                </Button>

                <div
                    style={{
                        marginTop: 16,
                        fontSize: 14,
                        textAlign: 'center',
                    }}
                >
                    이미 계정이 있으신가요?{' '}
                    <span
                        style={{ cursor: 'pointer', color: '#666' }}
                        onClick={() => navigate('/login')}
                    >
            로그인
          </span>
                </div>
            </Card>
        </div>
    )
}
