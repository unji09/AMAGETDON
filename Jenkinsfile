pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    triggers {
        githubPush()
    }

    environment {
        COMPOSE_FILES = '-f docker-compose.yaml -f docker-compose.prod.yml'
    }

    stages {
        stage('Sync') {
            steps {
                dir(env.DEPLOY_DIR) {
                    withCredentials([usernamePassword(
                        credentialsId: 'github-pat',
                        usernameVariable: 'GIT_USER',
                        passwordVariable: 'GIT_TOKEN'
                    )]) {
                        sh '''
                            git fetch "https://$GIT_USER:$GIT_TOKEN@github.com/aesnpa/AMAGETDON-v2.git" prod
                            git reset --hard FETCH_HEAD
                            git rev-parse --short HEAD
                        '''
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                dir(env.DEPLOY_DIR) {
                    sh 'docker compose $COMPOSE_FILES up -d --build'
                }
            }
        }

        stage('Verify') {
            steps {
                dir(env.DEPLOY_DIR) {
                    sh '''
                        DOMAIN=$(grep '^DOMAIN=' .env | cut -d= -f2-)
                        for i in $(seq 1 30); do
                            CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$DOMAIN" || true)
                            if [ "$CODE" = "200" ]; then
                                echo "OK: https://$DOMAIN -> 200"
                                exit 0
                            fi
                            echo "waiting... ($i/30, last=$CODE)"
                            sleep 5
                        done
                        echo "health check failed"
                        exit 1
                    '''
                }
            }
        }
    }

    post {
        failure {
            dir(env.DEPLOY_DIR) {
                sh 'docker compose $COMPOSE_FILES ps -a'
            }
        }
    }
}
