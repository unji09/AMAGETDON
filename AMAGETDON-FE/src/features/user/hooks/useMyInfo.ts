import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyInfo, updateMyInfo, type UserInfo, type InvestmentType, type LoginType } from '@/api/userApi.ts'
import { logoutApi, withdrawApi } from '@/api/authApi.ts'
import { getInvestmentLabel } from '@/constants/investmentType'


export const useMyInfo = () => {
    const navigate = useNavigate()
    const initialDataRef = useRef<UserInfo | null>(null)

    const [nickname, setNickname] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [investmentType, setInvestmentType] = useState<InvestmentType | null>(null)
    const [loginType, setLoginType] = useState<LoginType>('LOCAL')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const investmentTypeLabel = getInvestmentLabel(investmentType)
    const isSocialLogin = loginType === 'KAKAO'

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            navigate('/login', { replace: true })
            return
        }

        getMyInfo()
            .then(res => {
                const data = res.data
                initialDataRef.current = data
                setNickname(data.nickname)
                setEmail(data.email ?? '')
                setInvestmentType(data.investmentType)
                setLoginType(data.loginType)
            })
            .catch(() => {
                setError('사용자 정보를 불러오는데 실패했습니다.')
            })
            .finally(() => setLoading(false))
    }, [navigate])

    const handleSave = async () => {
        if (!nickname.trim()) {
            setError('닉네임을 입력해주세요.')
            return
        }

        try {
            setSaving(true)
            setError(null)
            setSuccessMsg(null)

            const payload: { email: string; nickname: string; password?: string } = {
                email,
                nickname,
            }
            if (password.trim()) {
                payload.password = password
            }

            const res = await updateMyInfo(payload)
            initialDataRef.current = res.data
            setPassword('')
            setSuccessMsg('변경사항이 저장되었습니다.')
            // 헤더 닉네임 갱신
            window.dispatchEvent(new Event('userInfoUpdated'))
        } catch {
            setError('변경사항 저장에 실패했습니다.')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        if (initialDataRef.current) {
            setNickname(initialDataRef.current.nickname)
            setEmail(initialDataRef.current.email ?? '')
            setInvestmentType(initialDataRef.current.investmentType)
            setPassword('')
            setError(null)
            setSuccessMsg(null)
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev)
    }

    const clearAuth = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
    }

    const handleLogout = async () => {
        try {
            await logoutApi()
        } catch {
            // 실패해도 로컬 인증 정보는 제거
        } finally {
            clearAuth()
            navigate('/', { replace: true })
        }
    }

    const handleWithdraw = async () => {
        const confirmed = window.confirm('정말 회원탈퇴를 진행하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
        if (!confirmed) return

        try {
            await withdrawApi()
            clearAuth()
            navigate('/', { replace: true })
        } catch {
            setError('회원탈퇴에 실패했습니다.')
        }
    }

    return {
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
    }
}
