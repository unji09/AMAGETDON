### 웹소켓

- TCP를 기반으로 사용자의 브라우저와 서버 사이의 동적인 양방향 연결 채널을 구성
- 프로토콜
    - ws : 암호화되지 않은 연결
    - wss : 암호화된 연결
- 필요한 경우
    - 실시간 양방향 데이터 통신이 필요한 경우
    - 많은 수의 동시 접속자를 수용해야 하는 경우
    - 브라우저에서 TCP 기반의 통신으로 확장해야 하는 경우
    - 개발자에게 사용하기 쉬운 API가 필요할 경우
- 한계점
    - 브라우저 지원 : HTML5를 지원하지 않는 브라우저에서는 사용 불가
    - 서버 비용 : 한 번 연결되면 에러나 지시가 없는 한 지속적인 연결을 유지하므로 많은 수의 연결을 동시에 관리하는 경우 서버의 부하 증가
    - 상세한 에러 처리 : 비정상적으로 연결이 끊어진 경우 연결이 끊어진 이유에 대해 정확히 알 수 없음
- 소켓 작동 방식
    - 서버 측 소켓
        1. 소켓 생성 : 클라이언트의 연결 요청을 대기하기 위한 소켓 생성
        2. 주소 할당(Binding) : IP 주소와 Port 번호를 할당 받음
        3. Listening : 연결되지 않을 소켓을 대기 모드로 전환
        4. accept() : 클라이언트가 연결 요청을 하면 수락 후 통신을 위한 새로운 소켓을 생성
        5. 데이터 송수신 : 연결이 설정되면 클라이언트와 서버가 소켓을 통해 데이터를 패킷 형태로 주고 받음
        6. 연결 종료 
    - 클라이언트 측 소켓
        1. 소켓 생성 : 서버에 연결하기 위한 소켓 생성
        2. 서버에 연결 : 서버가 설정한 IP, Port로 연결 시도
        3. 데이터 송수신 준비 : 서버가 accept로 요청을 수락하면 클라이언트의 socket descrptor가 반환되고 송수신할 준비 완료
        4. 데이터 송수신 : 데이터를 패킷 형태로 주고 받음
        5. 연결 종료
- SockJs Fallback
    - WebSocket 연결에 실패한 경우 HTTP 기반의 기술로 WebSocket interaction을 에뮬레이트하고 같은 애플리케이션 api를 노출
- Stomp
    - WebSocket 위에서 동작하는 문자 기반 메세징 프로토콜
    - 클라이언트와 서버가 전송할 메세지의 유형, 형식, 내용들을 정의
    - 장점
        - 메세징 프로토콜과 메세징 형식을 개발할 필요 없음
        - 구독을 관리가혹 메세지를 broadcast하는데 사용 가능
            - broadcast : 모든 클라이언트에 메세지를 보냄
- 사용 예제
    - 클라이언트
        
        ```jsx
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = Stomp.over(socket);
        
        // 연결
        stompClient.connect({}, function(frame) {
            console.log('Connected: ' + frame);
            
            // /topic/public 구독
            stompClient.subscribe('/topic/public', function(message) {
                const chatMessage = JSON.parse(message.body);
                console.log('받은 메시지:', chatMessage);
            });
            
            // 입장 메시지 전송
            stompClient.send("/app/chat/addUser", {}, JSON.stringify({
                sender: 'user1',
                type: 'JOIN'
            }));
        });
        
        // 메시지 전송
        function sendMessage(content) {
            stompClient.send("/app/chat/message", {}, JSON.stringify({
                sender: 'user1',
                content: content,
                type: 'CHAT'
            }));
        }
        
        // 연결 끊김
        stompClient.onDisconnect = function() {
            console.log('WebSocket 연결 닫힘');
        };
        ```
        
    - 서버
        - WebSocket 의존성 추가
        - WebSocket Config 설정
            
            ```java
            @Configuration
            @EnableWebSocketMessageBroker
            public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
                
                @Override
                public void configureMessageBroker(MessageBrokerRegistry config) {
                    // 클라이언트가 구독할 엔드포인트 prefix
                    config.enableSimpleBroker("/topic", "/queue");
                    
                    // 클라이언트가 메시지를 보낼 엔드포인트 prefix
                    config.setApplicationDestinationPrefixes("/app");
                }
                
                @Override
                public void registerStompEndpoints(StompEndpointRegistry registry) {
                    // STOMP 엔드포인트 등록
                    registry.addEndpoint("/ws")
                            .setAllowedOrigins("*")
                            .withSockJS();
                }
            }
            ```
            
        - Contoller
            
            ```java
            @Controller
            public class ChatController {
                
                private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
                
                // 클라이언트가 /app/chat/message 로 메시지를 보냄
                // → /topic/public 구독자들에게 브로드캐스트
                @MessageMapping("/chat/message")
                @SendTo("/topic/public")
                public ChatMessage sendMessage(ChatMessage chatMessage) {
                    logger.info("메시지 수신: {}", chatMessage);
                    return chatMessage;
                }
                
                // 클라이언트가 /app/chat/addUser 로 입장 메시지 보냄
                // → /topic/public 구독자들에게 브로드캐스트
                @MessageMapping("/chat/addUser")
                @SendTo("/topic/public")
                public ChatMessage addUser(ChatMessage chatMessage) {
                    chatMessage.setType(MessageType.JOIN);
                    logger.info("사용자 입장: {}", chatMessage.getSender());
                    return chatMessage;
                }
            }
            ```