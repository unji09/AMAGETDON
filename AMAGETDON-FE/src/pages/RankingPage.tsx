import { Layout, ContainerContent } from '@/components/layout';

export const RankingPage = () => {
    return (
        <Layout>
            <ContainerContent>
                <div style={{ padding: '40px 0' }}>
                    <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>
                        랭킹
                    </h1>
                    <p style={{ color: '#666' }}>
                        랭킹 페이지 (추후 구현)
                    </p>
                </div>
            </ContainerContent>
        </Layout>
    );
};