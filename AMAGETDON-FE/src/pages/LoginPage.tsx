// import { Layout } from "../components/layout/Layout";
// import { Container } from "../components/layout/Container";
// import { KakaoLoginButton } from "../features/auth";
//
// export const LoginPage = () => {
//     return (
//         <Layout>
//             <Container>
//                 <h2>로그인</h2>
//                 <KakaoLoginButton />
//             </Container>
//         </Layout>
//     );
// };

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '@/components/common'
import {useLogin} from "@/features/auth/hooks/login.ts";
import {KakaoLoginButton} from "@/features/auth";

export default function LoginPage() {
    const navigate = useNavigate()
    const { login, loading, error } = useLogin()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [touched, setTouched] = useState(false)

    const isValid = email.trim() !== '' && password.trim() !== ''

    const handleSubmit = async () => {
        setTouched(true)
        if (!isValid || loading) return

        try {
            await login({ email, password })
            navigate('/') // 로그인 성공 후 메인
        } catch {
            // 에러는 hook에서 처리
        }
    }

    return (
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 80 }}>
            <Card>
                <h2 style={{ marginBottom: 24 }}>로그인</h2>

                <Input
                    label="이메일"
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

                {touched && !isValid && (
                    <p style={{ color: 'red', marginTop: 8 }}>
                        이메일과 비밀번호를 모두 입력해주세요.
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
                    {loading ? '로그인 중...' : '로그인'}
                </Button>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 16,
                        fontSize: 14,
                    }}
                >
          <span
              style={{ cursor: 'pointer', color: '#666' }}
              onClick={() => navigate('/password-reset')}
          >
            비밀번호 찾기
          </span>

                    <span
                        style={{ cursor: 'pointer', color: '#666' }}
                        onClick={() => navigate('/signup')}
                    >
            회원가입
          </span><KakaoLoginButton />
                </div>
            </Card>
        </div>
    )
}
