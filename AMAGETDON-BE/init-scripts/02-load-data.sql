-- chapters 데이터 로드 (중복 시 자동 스킵)
LOAD DATA INFILE '/var/lib/mysql-files/chapters.csv'
    IGNORE
    INTO TABLE chapters
    CHARACTER SET utf8mb4
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\r\n'
    IGNORE 1 ROWS
    (chapter_id, chapter_type, base_chapter_no, chapter_title,
     chapter_summary, chapter_content, created_at, updated_at);


-- quizzes 데이터 로드 (중복 시 자동 스킵)
LOAD DATA INFILE '/var/lib/mysql-files/quizzes.csv'
    IGNORE
    INTO TABLE quizzes
    CHARACTER SET utf8mb4
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\r\n'
    IGNORE 1 ROWS
    (quiz_id, chapter_id, quiz_type, quiz_title, quiz_content,
     answer_ox, difficulty, hint, explanation_text, created_at, updated_at);


-- quiz_choices 데이터 로드 (중복 시 자동 스킵)
LOAD DATA INFILE '/var/lib/mysql-files/quiz_choices.csv'
    IGNORE
    INTO TABLE quiz_choices
    CHARACTER SET utf8mb4
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\r\n'
    IGNORE 1 ROWS
    (choice_id, quiz_id, choice_no, choice_text, is_answer);