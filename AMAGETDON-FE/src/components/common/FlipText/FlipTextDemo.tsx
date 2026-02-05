import { useState, useEffect } from 'react';
import { FlipText } from './FlipText';

/**
 * FlipText 애니메이션 테스트용 컴포넌트
 * 1초마다 랜덤하게 가격이 변동됨
 */
export const FlipTextDemo = () => {
    const [price, setPrice] = useState(75000);
    const [rate, setRate] = useState(2.35);

    useEffect(() => {
        const interval = setInterval(() => {
            // 랜덤 가격 변동 (-500 ~ +500)
            setPrice(prev => {
                const change = Math.floor(Math.random() * 1001) - 500;
                return Math.max(70000, prev + change);
            });
            // 랜덤 등락률 변동
            setRate(prev => {
                const change = (Math.random() - 0.5) * 2;
                return Math.round((prev + change) * 100) / 100;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatPrice = (n: number) => n.toLocaleString() + '원';
    const formatRate = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

    return (
        <div style={{
            padding: '40px',
            background: '#fff',
            borderRadius: '12px',
            maxWidth: '400px',
            margin: '40px auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ marginBottom: '8px', fontSize: '18px', color: '#333' }}>
                FlipText 애니메이션 테스트
            </h2>
            <p style={{ marginBottom: '24px', fontSize: '12px', color: '#888' }}>
                1초마다 값이 변경됩니다
            </p>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>현재가</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    <FlipText value={formatPrice(price)} />
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>등락률</div>
                <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: rate >= 0 ? '#e74c3c' : '#3498db'
                }}>
                    <FlipText value={formatRate(rate)} />
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #eee'
            }}>
                <div>
                    <div style={{ fontSize: '11px', color: '#888' }}>거래량</div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        <FlipText value={(Math.floor(price / 10) * 100).toLocaleString()} />
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '11px', color: '#888' }}>시가총액</div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        <FlipText value={(price * 1000000).toLocaleString() + '원'} />
                    </div>
                </div>
            </div>
        </div>
    );
};
