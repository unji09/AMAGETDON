import { Layout, ContainerContent } from '@/components/layout';

export const HomePage = () => {
    return (
        <Layout>
            <ContainerContent>
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>
                        AMAGETDON
                    </h1>
                    <p style={{ fontSize: '18px', color: '#666' }}>
                        실시간 주식 투자 커뮤니티
                    </p>
                </div>
            </ContainerContent>
        </Layout>
    );
};