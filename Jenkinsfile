pipeline {
    agent any
    
    environment {
        DOCKER_HUB_USERNAME = 'gopal161'  // CHANGE THIS to your Docker Hub username
        
        // Docker Image Names
        BACKEND_IMAGE = "${DOCKER_HUB_USERNAME}/quibly-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USERNAME}/quibly-frontend"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                echo 'Cloning repository from Git...'
                checkout scm
                sh 'git log -1 --pretty=format:"%h - %an: %s"'
            }
        }
        
        stage('Build Backend Image') {
            steps {
                echo 'Building Backend Docker Image...'
                script {
                    dir('backend') {
                        sh """
                            docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} .
                            docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest
                        """
                    }
                }
                echo 'Backend image built successfully!'
            }
        }
        
        stage('Build Frontend Image') {
            steps {
                echo 'Building Frontend Docker Image...'
                script {
                    dir('frontend') {
                        sh """
                            docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} .
                            docker tag ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest
                        """
                    }
                }
                echo 'Frontend image built successfully!'
            }
        }
        
       stage('Login to Docker Hub') {
    steps {
        withCredentials([
            usernamePassword(
                credentialsId: 'dockerhub',
                usernameVariable: 'DOCKER_USER',    
                passwordVariable: 'DOCKER_PASS'
            )
        ]) {
            sh '''
                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            '''
        }
    }
}

        
        stage('Push Backend to Docker Hub') {
            steps {
                echo 'Pushing Backend image to Docker Hub...'
                sh """
                    docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                    docker push ${BACKEND_IMAGE}:latest
                """
                echo 'Backend image pushed successfully!'
            }
        }
        
        stage('Push Frontend to Docker Hub') {
            steps {
                echo 'Pushing Frontend image to Docker Hub...'
                sh """
                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                    docker push ${FRONTEND_IMAGE}:latest
                """
                echo 'Frontend image pushed successfully!'
            }
        }
        
        stage('Cleanup Local Images') {
            steps {
                echo 'Cleaning up local Docker images...'
                sh """
                    docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG} || true
                    docker rmi ${BACKEND_IMAGE}:latest || true
                    docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} || true
                    docker rmi ${FRONTEND_IMAGE}:latest || true
                """
                echo 'Cleanup completed!'
            }
        }
    }
    
    post {
        success {
            echo '========================================='
            echo 'CI/CD Pipeline Completed Successfully!'
            echo '========================================='
            echo "Backend Image: ${BACKEND_IMAGE}:${IMAGE_TAG}"
            echo "Backend Image: ${BACKEND_IMAGE}:latest"
            echo "Frontend Image: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
            echo "Frontend Image: ${FRONTEND_IMAGE}:latest"
            echo '========================================='
        }
        failure {
            echo '========================================='
            echo 'Pipeline Failed!'
            echo 'Check the logs above for errors.'
            echo '========================================='
        }
    }
}
