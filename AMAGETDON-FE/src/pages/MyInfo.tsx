import { useEffect, useState } from 'react'
import { Button, Input, Card } from '@/components/common'
import {getMyInfo, updateMyInfo} from "@/features/user/api/userApi.ts";


export default function MyPage() {
    const [nickname, setNickname] = useState('')

    useEffect(() => {
        getMyInfo().then(res => setNickname(res.data.nickname))
    }, [])

    return (
        <Card>
            <Input label="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} />
            <Button onClick={() => updateMyInfo(nickname)}>저장</Button>
        </Card>
    )
}
