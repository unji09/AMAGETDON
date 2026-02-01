import { Link } from 'react-router-dom';
import { Layout, ContainerContent } from '@/components/layout';
import { Button } from '@/components/common';

export const NotFoundPage = () => {
    return (
        <Layout>
            <ContainerContent>
                <div style={{
                    padding: '80px 0',
                    textAlign: 'center'
                }}>
                    <h1 style={{
                        fontSize: '72px',
                        marginBottom: '16px',
                        color: '#666'
                    }}>
                        404
                    </h1>
                    <p style={{
                        fontSize: '20px',
                        marginBottom: '32px',
                        color: '#666'
                    }}>
                        페이지를 찾을 수 없습니다
                    </p>
                    <Link to="/">
                        <Button variant="primary">
                            홈으로 돌아가기
                        </Button>
                    </Link>
                </div>
            </ContainerContent>
        </Layout>
    );
};