DELETE duplicate_note
FROM review_notes duplicate_note
         JOIN review_notes keep_note
              ON duplicate_note.user_id = keep_note.user_id
                  AND duplicate_note.quiz_id = keep_note.quiz_id
                  AND duplicate_note.review_note_id > keep_note.review_note_id;

SET @constraint_exists := (SELECT COUNT(*)
                           FROM information_schema.TABLE_CONSTRAINTS
                           WHERE TABLE_SCHEMA = DATABASE()
                             AND TABLE_NAME = 'review_notes'
                             AND CONSTRAINT_NAME = 'uk_review_notes_user_quiz');

SET @add_constraint := IF(@constraint_exists = 0,
                          'ALTER TABLE review_notes ADD CONSTRAINT uk_review_notes_user_quiz UNIQUE (user_id, quiz_id)',
                          'DO 0');

PREPARE add_constraint_statement FROM @add_constraint;
EXECUTE add_constraint_statement;
DEALLOCATE PREPARE add_constraint_statement;
