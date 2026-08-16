package com.amagetdon.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Validation
    INVALID_JSON("잘못된 JSON 형식입니다. 요청 데이터를 확인하세요."),
    INVALID_INPUT("입력이 잘못되었습니다."),
    MISSING_PARAMETER("필수 파라미터가 누락되었습니다."),
    INVALID_TYPE("입력한 값의 타입이 잘못되었습니다."),
    CLIENT_DISCONNECTED("이미 클라이언트에서 요청이 종료되었습니다."),
    RESOURCE_NOT_FOUND("요청한 리소스를 찾을 수 없습니다."),
    METHOD_NOT_SUPPORTED("허용되지 않은 메서드입니다."),
    MEDIA_TYPE_NOT_SUPPORTED("허용되지 않은 미디어 타입입니다."),
    SERVER_ERROR("서버 오류가 발생했습니다. 관리자에게 문의해주세요."),
    EMAIL_ALREADY_EXISTS("이미 존재하는 이메일입니다."),
    INVALID_CREDENTIALS("이메일 또는 비밀번호가 일치하지 않습니다."),
    OAUTH_ACCOUNT_EXISTS("소셜 로그인으로 가입된 계정입니다. 카카오/구글 로그인을 이용해주세요"),

    // User
    USER_NOT_FOUND("회원을 찾을 수 없습니다. UserId: %d"),
    USER_NOT_FOUND_SIMPLE("회원을 찾을 수 없습니다."),
    INSUFFICIENT_BALANCE("잔액이 부족합니다."),

    // Token
    TOKEN_EXPIRED("토큰이 만료되었습니다. 새로운 토큰을 재발급 받으세요."),
    TOKEN_INVALID("유효하지 않은 토큰입니다. 다시 로그인해 주세요."),
    REFRESH_TOKEN_EXPIRED("리프레시 토큰이 만료되었습니다. 다시 로그인해 주세요."),
    TOKEN_HEADER_INVALID("토큰 헤더 형식이 잘못되었습니다."),
    TOKEN_MISSING("토큰이 요청 헤더에 없습니다. 새로운 토큰을 재발급 받으세요."),
    TOKEN_BLACKLISTED("해당 토큰은 사용이 금지되었습니다. 다시 로그인해 주세요."),

    // Redis
    REDIS_MESSAGE_NULL("Redis 메시지가 null입니다."),
    REDIS_MESSAGE_EMPTY("Redis 메시지 본문이 비어있습니다."),
    REDIS_CHANNEL_INVALID("Redis 채널 형식이 잘못되었습니다. channel: %s"),
    REDIS_MESSAGE_DESERIALIZATION_FAILED("Redis 메시지 역직렬화에 실패했습니다. channel: %s"),
    WEBSOCKET_MESSAGE_SEND_FAILED("WebSocket 메시지 전송에 실패했습니다. battleId: %s"),
    MESSAGE_SENT_TO_DLQ("메시지가 Dead Letter Queue로 전송되었습니다. reason: %s"),
    MESSAGE_RETRY_EXHAUSTED("재시도 횟수를 초과했습니다. maxAttempts: %d"),

    // Chapter
    CHAPTER_NOT_FOUND("챕터를 찾을 수 없습니다."),
    CHAPTER_LOCKED("잠긴 챕터는 조회할 수 없습니다."),

    // Achievement
    ACHIEVEMENT_NOT_FOUND("업적을 찾을 수 없습니다."),

    //Community
    ALREADY_JOINED_ROOM("그룹은 하나만 참여할 수 있습니다. 현재 그룹을 나간 후 다시 시도하세요."),
    ROOM_FULL("정원이 가득 찼습니다."),
    ROOM_NOT_FOUND("존재하지 않는 그룹입니다."),
    PRIVATE_ROOM_ACCESS_DENIED("비공개 그룹은 참여 코드로만 입장할 수 있습니다."),
    INVALID_JOIN_CODE("유효하지 않은 참여 코드입니다."),
    ALREADY_ROOM_OWNER("이미 생성한 그룹이 있습니다."),
    NOT_ROOM_MEMBER("해당 그룹의 멤버가 아닙니다."),
    SESSION_NOT_FOUND("세션을 찾을 수 없습니다."),

    // Trading
    PRICE_NOT_AVAILABLE("현재가를 조회할 수 없습니다."),
    STOCK_INFO_NOT_FOUND("주식 정보를 찾을 수 없습니다."),
    STOCK_NOT_TRADABLE("현재 거래할 수 없는 종목입니다."),
    NO_OWNED_STOCK("보유한 주식이 없습니다."),
    INSUFFICIENT_STOCK_QUANTITY("보유 수량이 부족합니다."),
    MARKET_CLOSED("장 시간이 아닙니다. 거래 가능 시간: 09:00 ~ 15:30"),
    INVALID_QUANTITY("거래 수량은 1 이상이어야 합니다."),

    // Ranking
    RANKING_AGGREGATION_FAILED("랭킹 집계 중 오류가 발생했습니다."),
    USER_PROFIT_CALCULATION_FAILED("유저 수익 계산에 실패했습니다. UserId: %d"),
    LEARNING_RANKING_NOT_FOUND("학습 랭킹 정보를 찾을 수 없습니다."),

    // Watchlist
    WATCHLIST_ALREADY_EXISTS("이미 관심 종목으로 등록된 종목입니다."),
    STOCK_NOT_FOUND("존재하지 않는 종목입니다."),
    STOCK_CODE_REQUIRED("종목 코드는 필수입니다."),
    WATCHLIST_NOT_FOUND("관심 종목을 찾을 수 없습니다."),
    WATCHLIST_ACCESS_DENIED("본인의 관심 종목만 삭제할 수 있습니다."),
    INVALID_STOCK_CODE_FORMAT("잘못된 주식 코드 형식입니다. 6자리 숫자를 입력해주세요."),
    WATCHLIST_NOT_IN_LIST("해당 종목은 관심 종목에 포함되어 있지 않습니다."),

    // Chart
    WRONG_PERIOD("잘못된 기간입니다."),

    // Stock
    KEYWORD_TOO_SHORT("검색어는 2글자 이상 입력해주세요."),

    // ReviewNote
    REVIEW_NOTE_NOT_FOUND("오답노트를 찾을 수 없습니다."),
    REVIEW_NOTE_ACCESS_DENIED("본인의 오답노트만 삭제할 수 있습니다.");


    private final String message;

    public String format(Object... args) {
        return String.format(message, args);
    }
}