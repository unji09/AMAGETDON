import { Layout } from "../components/layout/Layout";
import { Container } from "../components/layout/Container";
import { KakaoLoginButton } from "../features/auth";

export const LoginPage = () => {
    return (
        <Layout>
            <Container>
                <h2>로그인</h2>
                <KakaoLoginButton />
            </Container>
        </Layout>
    );
};
