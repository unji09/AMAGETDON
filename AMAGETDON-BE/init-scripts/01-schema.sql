-- 테이블이 없을 때만 생성
CREATE TABLE IF NOT EXISTS chapters (
    chapter_id INT PRIMARY KEY,
    chapter_type VARCHAR(20) NOT NULL,
    base_chapter_no INT NOT NULL,
    chapter_title VARCHAR(200) NOT NULL,
    chapter_summary TEXT,
    chapter_content LONGTEXT,
    created_at DATE,
    updated_at DATE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id INT PRIMARY KEY,
    chapter_id INT NOT NULL,
    quiz_type VARCHAR(20) NOT NULL,
    quiz_title VARCHAR(200) NOT NULL,
    quiz_content TEXT,
    answer_ox VARCHAR(10),
    difficulty VARCHAR(20),
    hint TEXT,
    explanation_text TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_choices (
    choice_id INT PRIMARY KEY,
    quiz_id INT NOT NULL,
    choice_no INT NOT NULL,
    choice_text TEXT NOT NULL,
    is_answer VARCHAR(10) NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS survey_questions (
    question_id BIGINT PRIMARY KEY,
    question_text TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;