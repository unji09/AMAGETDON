CREATE TABLE users
(
    user_id         BIGINT       NOT NULL AUTO_INCREMENT,
    password        VARCHAR(255) NULL,
    email           VARCHAR(50)  NULL,
    nickname        VARCHAR(50)  NOT NULL,
    investment_type VARCHAR(255) NULL,
    login_type      VARCHAR(255) NULL,
    social_id       BIGINT       NULL,
    current_title   VARCHAR(255) NULL,
    total_points    INT          NULL,
    balance         BIGINT       NOT NULL,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (user_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE survey_questions
(
    question_id   BIGINT       NOT NULL,
    question_text VARCHAR(255) NOT NULL,
    PRIMARY KEY (question_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE chapters
(
    chapter_id      BIGINT       NOT NULL AUTO_INCREMENT,
    chapter_type    VARCHAR(255) NOT NULL,
    base_chapter_no INT          NULL,
    chapter_title   VARCHAR(100) NOT NULL,
    chapter_summary TEXT         NULL,
    chapter_content TEXT         NOT NULL,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (chapter_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE quizzes
(
    quiz_id          BIGINT       NOT NULL AUTO_INCREMENT,
    chapter_id       BIGINT       NOT NULL,
    quiz_type        VARCHAR(255) NOT NULL,
    quiz_title       VARCHAR(120) NOT NULL,
    quiz_content     TEXT         NOT NULL,
    answer_ox        BIT(1)       NULL,
    difficulty       VARCHAR(255) NOT NULL,
    hint             TEXT         NULL,
    explanation_text TEXT         NULL,
    created_at       DATETIME(6)  NOT NULL,
    updated_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (quiz_id),
    CONSTRAINT fk_quizzes_chapter FOREIGN KEY (chapter_id) REFERENCES chapters (chapter_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE quiz_choices
(
    choice_id   BIGINT       NOT NULL AUTO_INCREMENT,
    quiz_id     BIGINT       NOT NULL,
    choice_no   INT          NOT NULL,
    choice_text VARCHAR(255) NOT NULL,
    is_answer   BIT(1)       NOT NULL,
    PRIMARY KEY (choice_id),
    CONSTRAINT fk_quiz_choices_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (quiz_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE cached_quizzes
(
    cached_quiz_id   BIGINT       NOT NULL AUTO_INCREMENT,
    quiz_type        VARCHAR(255) NOT NULL,
    quiz_content     TEXT         NOT NULL,
    answer_ox        BIT(1)       NULL,
    difficulty       VARCHAR(255) NOT NULL,
    hint             TEXT         NULL,
    explanation_text TEXT         NULL,
    is_used          BIT(1)       NOT NULL,
    created_at       DATETIME(6)  NOT NULL,
    updated_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (cached_quiz_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE cached_quiz_choices
(
    cached_choice_id BIGINT       NOT NULL AUTO_INCREMENT,
    cached_quiz_id   BIGINT       NOT NULL,
    choice_no        INT          NOT NULL,
    choice_text      VARCHAR(300) NOT NULL,
    is_answer        BIT(1)       NOT NULL,
    created_at       DATETIME(6)  NOT NULL,
    updated_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (cached_choice_id),
    CONSTRAINT fk_cached_quiz_choices_quiz FOREIGN KEY (cached_quiz_id) REFERENCES cached_quizzes (cached_quiz_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE daily_learning_rewards
(
    reward_id          BIGINT NOT NULL AUTO_INCREMENT,
    user_id            BIGINT NOT NULL,
    quiz_reward_date   DATE   NOT NULL,
    review_reward_date DATE   NOT NULL,
    PRIMARY KEY (reward_id),
    INDEX idx_daily_learning_rewards_user (user_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE daily_quiz_histories
(
    history_id     BIGINT      NOT NULL AUTO_INCREMENT,
    user_id        BIGINT      NOT NULL,
    quiz_id        BIGINT      NOT NULL,
    quiz_date      DATE        NOT NULL,
    quiz_sequence  INT         NOT NULL,
    is_correct     BIT(1)      NOT NULL,
    answered_at    DATETIME(6) NOT NULL,
    PRIMARY KEY (history_id),
    INDEX idx_daily_quiz_histories_user_date (user_id, quiz_date)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE review_notes
(
    review_note_id BIGINT      NOT NULL AUTO_INCREMENT,
    user_id        BIGINT      NOT NULL,
    quiz_id        BIGINT      NOT NULL,
    created_at     DATETIME(6) NOT NULL,
    PRIMARY KEY (review_note_id),
    UNIQUE KEY uk_review_notes_user_quiz (user_id, quiz_id),
    INDEX idx_review_notes_user (user_id),
    CONSTRAINT fk_review_notes_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (quiz_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE user_chapter_progresses
(
    chapter_id        BIGINT      NOT NULL,
    user_id           BIGINT      NOT NULL,
    is_completed      BIT(1)      NOT NULL,
    completed_at      DATETIME(6) NULL,
    created_at        DATETIME(6) NOT NULL,
    recent_updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (chapter_id, user_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE achievements
(
    achievement_id       BIGINT       NOT NULL AUTO_INCREMENT,
    achievement_name     VARCHAR(100) NOT NULL,
    achievement_icon     VARCHAR(255) NOT NULL,
    achievement_content  TEXT         NOT NULL,
    achievement_category VARCHAR(50)  NOT NULL,
    target_value         BIGINT       NOT NULL,
    comparison_type      VARCHAR(10)  NOT NULL,
    created_at           DATETIME(6)  NOT NULL,
    updated_at           DATETIME(6)  NOT NULL,
    PRIMARY KEY (achievement_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE user_achievements
(
    user_id        BIGINT      NOT NULL,
    achievement_id BIGINT      NOT NULL,
    is_achieved    BIT(1)      NOT NULL,
    achieved_at    DATETIME(6) NULL,
    PRIMARY KEY (user_id, achievement_id),
    CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements (achievement_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE rooms
(
    room_id              BIGINT       NOT NULL AUTO_INCREMENT,
    owner_id             BIGINT       NOT NULL,
    name                 VARCHAR(50)  NOT NULL,
    max_member_count     INT          NOT NULL,
    current_member_count INT          NOT NULL,
    is_public            BIT(1)       NOT NULL,
    join_code            VARCHAR(20)  NULL,
    created_at           DATETIME(6)  NOT NULL,
    openvidu_session_id  VARCHAR(100) NULL,
    PRIMARY KEY (room_id),
    UNIQUE KEY uk_rooms_join_code (join_code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE members
(
    member_id    BIGINT      NOT NULL AUTO_INCREMENT,
    room_id      BIGINT      NOT NULL,
    user_id      BIGINT      NOT NULL,
    is_active    BIT(1)      NOT NULL,
    joined_at    DATETIME(6) NOT NULL,
    last_read_at DATETIME(6) NULL,
    PRIMARY KEY (member_id),
    INDEX idx_member_room_user_active (room_id, user_id, is_active)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE learning_rankings
(
    ranking_id    BIGINT      NOT NULL AUTO_INCREMENT,
    user_id       BIGINT      NOT NULL,
    ranking       INT         NOT NULL,
    total_correct INT         NOT NULL,
    updated_at    DATETIME(6) NOT NULL,
    PRIMARY KEY (ranking_id),
    INDEX idx_learning_rankings_user (user_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE profit_rankings
(
    ranking_id   BIGINT         NOT NULL AUTO_INCREMENT,
    user_id      BIGINT         NOT NULL,
    ranking      INT            NOT NULL,
    total_profit DECIMAL(15, 2) NOT NULL,
    updated_at   DATETIME(6)    NOT NULL,
    PRIMARY KEY (ranking_id),
    INDEX idx_profit_rankings_user (user_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE sector
(
    sector_code  VARCHAR(10)  NOT NULL,
    sector_name  VARCHAR(100) NOT NULL,
    sector_level VARCHAR(255) NOT NULL,
    parent_code  VARCHAR(10)  NULL,
    created_at   DATETIME(6)  NOT NULL,
    PRIMARY KEY (sector_code),
    CONSTRAINT fk_sector_parent FOREIGN KEY (parent_code) REFERENCES sector (sector_code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE stock
(
    stock_code  VARCHAR(20)    NOT NULL,
    stock_name  VARCHAR(100)   NOT NULL,
    market_type VARCHAR(255)   NOT NULL,
    sector_code VARCHAR(10)    NULL,
    per         DECIMAL(10, 2) NULL,
    pbr         DECIMAL(10, 2) NULL,
    eps         INT            NULL,
    bps         INT            NULL,
    market_cap  BIGINT         NULL,
    created_at  DATETIME(6)    NOT NULL,
    updated_at  DATETIME(6)    NOT NULL,
    PRIMARY KEY (stock_code),
    CONSTRAINT fk_stock_sector FOREIGN KEY (sector_code) REFERENCES sector (sector_code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE stock_prices
(
    price_id      BIGINT        NOT NULL AUTO_INCREMENT,
    stock_code    VARCHAR(20)   NULL,
    current_price VARCHAR(20)   NOT NULL,
    volume        INT           NOT NULL,
    trading_value BIGINT        NOT NULL,
    change_amount INT           NOT NULL,
    change_rate   DECIMAL(5, 2) NOT NULL,
    created_at    DATETIME(6)   NOT NULL,
    PRIMARY KEY (price_id),
    CONSTRAINT fk_stock_prices_stock FOREIGN KEY (stock_code) REFERENCES stock (stock_code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE chart_candles
(
    candle_id     BIGINT      NOT NULL AUTO_INCREMENT,
    stock_code    VARCHAR(20) NULL,
    interval_type VARCHAR(10) NOT NULL,
    candle_time   DATETIME(6) NOT NULL,
    open_price    INT         NOT NULL,
    high_price    INT         NOT NULL,
    low_price     INT         NOT NULL,
    close_price   INT         NOT NULL,
    volume        BIGINT      NOT NULL,
    created_at    DATETIME(6) NOT NULL,
    PRIMARY KEY (candle_id),
    INDEX idx_chart_candles_stock_interval_time (stock_code, interval_type, candle_time),
    CONSTRAINT fk_chart_candles_stock FOREIGN KEY (stock_code) REFERENCES stock (stock_code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE stock_holdings
(
    stock_code VARCHAR(20)    NOT NULL,
    user_id    BIGINT         NOT NULL,
    quantity   INT            NOT NULL,
    avg_price  DECIMAL(15, 2) NOT NULL,
    updated_at DATETIME(6)    NOT NULL,
    PRIMARY KEY (stock_code, user_id),
    CONSTRAINT fk_stock_holdings_stock FOREIGN KEY (stock_code) REFERENCES stock (stock_code),
    CONSTRAINT fk_stock_holdings_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `transaction`
(
    transaction_id   BIGINT       NOT NULL AUTO_INCREMENT,
    stock_code       VARCHAR(20)  NOT NULL,
    user_id          BIGINT       NOT NULL,
    transaction_type VARCHAR(255) NOT NULL,
    quantity         INT          NOT NULL,
    price            INT          NOT NULL,
    total_amount     BIGINT       NOT NULL,
    fee_amount       INT          NOT NULL,
    created_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (transaction_id),
    CONSTRAINT fk_transaction_stock FOREIGN KEY (stock_code) REFERENCES stock (stock_code),
    CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE watchlist
(
    watchlist_id BIGINT      NOT NULL AUTO_INCREMENT,
    user_id      BIGINT      NOT NULL,
    stock_code   VARCHAR(20) NOT NULL,
    created_at   DATETIME(6) NOT NULL,
    PRIMARY KEY (watchlist_id),
    CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_watchlist_stock FOREIGN KEY (stock_code) REFERENCES stock (stock_code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
