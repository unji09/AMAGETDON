package com.amagetdon.common.migration;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.zip.CRC32;

/**
 * CSV 시드 데이터를 적재하는 반복 실행(Repeatable) 마이그레이션.
 * getChecksum()이 CSV 내용을 해시하므로, CSV를 수정하면 다음 기동 때 자동으로 다시 실행된다.
 */
@Component
public class R__Seed_master_data extends BaseJavaMigration {

    private static final Logger log = LoggerFactory.getLogger(R__Seed_master_data.class);

    private static final String SEED_PATH = "db/seed/";
    private static final List<String> SEED_FILES = List.of(
            "chapters.csv",
            "quizzes.csv",
            "quiz_choices.csv",
            "survey_questions.csv",
            "achievements.csv"
    );

    private static final int BYTE_ORDER_MARK = 0xFEFF;

    private static final DateTimeFormatter TIMESTAMP_FORMAT = new DateTimeFormatterBuilder()
            .append(DateTimeFormatter.ISO_LOCAL_DATE)
            .optionalStart()
            .optionalStart().appendLiteral(' ').optionalEnd()
            .optionalStart().appendLiteral('T').optionalEnd()
            .append(DateTimeFormatter.ISO_LOCAL_TIME)
            .optionalEnd()
            .parseDefaulting(ChronoField.HOUR_OF_DAY, 0)
            .parseDefaulting(ChronoField.MINUTE_OF_HOUR, 0)
            .parseDefaulting(ChronoField.SECOND_OF_MINUTE, 0)
            .toFormatter();

    @Override
    public Integer getChecksum() {
        CRC32 crc = new CRC32();
        for (String file : SEED_FILES) {
            crc.update(readBytes(file));
        }
        return (int) crc.getValue();
    }

    @Override
    public void migrate(Context context) throws Exception {
        Connection connection = context.getConnection();
        warnRowsMissingFromCsv(connection, "chapters", "chapter_id", seedChapters(connection));
        warnRowsMissingFromCsv(connection, "quizzes", "quiz_id", seedQuizzes(connection));
        warnRowsMissingFromCsv(connection, "quiz_choices", "choice_id", seedQuizChoices(connection));
        warnRowsMissingFromCsv(connection, "survey_questions", "question_id", seedSurveyQuestions(connection));
        warnRowsMissingFromCsv(connection, "achievements", "achievement_id", seedAchievements(connection));
    }

    private void warnRowsMissingFromCsv(Connection connection, String table, String idColumn, List<Long> csvIds)
            throws SQLException {
        Set<Long> seededIds = new HashSet<>(csvIds);
        List<Long> missing = new ArrayList<>();

        try (Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery("SELECT " + idColumn + " FROM " + table)) {
            while (rows.next()) {
                long id = rows.getLong(1);
                if (!seededIds.contains(id)) {
                    missing.add(id);
                }
            }
        }

        if (!missing.isEmpty()) {
            log.warn("{} 에 CSV 에 없는 행 {}건 - {} (삭제가 필요하면 V*__.sql 에 명시하세요)",
                    table, missing.size(), missing);
        }
    }

    private List<Long> seedChapters(Connection connection) throws Exception {
        String sql = """
                INSERT INTO chapters (chapter_id, chapter_type, base_chapter_no, chapter_title,
                                      chapter_summary, chapter_content, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?) AS src
                ON DUPLICATE KEY UPDATE chapter_type    = src.chapter_type,
                                        base_chapter_no = src.base_chapter_no,
                                        chapter_title   = src.chapter_title,
                                        chapter_summary = src.chapter_summary,
                                        chapter_content = src.chapter_content,
                                        updated_at      = src.updated_at
                """;
        return upsert(connection, "chapters.csv", "chapter_id", sql, (ps, row) -> {
            ps.setLong(1, requireLong(row, "chapter_id"));
            ps.setString(2, require(row, "chapter_type"));
            setInteger(ps, 3, row.get("base_chapter_no"));
            ps.setString(4, require(row, "chapter_title"));
            ps.setString(5, blankToNull(row.get("chapter_summary")));
            ps.setString(6, require(row, "chapter_content"));
            ps.setTimestamp(7, toTimestamp(row.get("created_at")));
            ps.setTimestamp(8, toTimestamp(row.get("updated_at")));
        });
    }

    private List<Long> seedQuizzes(Connection connection) throws Exception {
        String sql = """
                INSERT INTO quizzes (quiz_id, chapter_id, quiz_type, quiz_title, quiz_content,
                                     answer_ox, difficulty, hint, explanation_text, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) AS src
                ON DUPLICATE KEY UPDATE chapter_id       = src.chapter_id,
                                        quiz_type        = src.quiz_type,
                                        quiz_title       = src.quiz_title,
                                        quiz_content     = src.quiz_content,
                                        answer_ox        = src.answer_ox,
                                        difficulty       = src.difficulty,
                                        hint             = src.hint,
                                        explanation_text = src.explanation_text,
                                        updated_at       = src.updated_at
                """;
        return upsert(connection, "quizzes.csv", "quiz_id", sql, (ps, row) -> {
            ps.setLong(1, requireLong(row, "quiz_id"));
            ps.setLong(2, requireLong(row, "chapter_id"));
            ps.setString(3, require(row, "quiz_type"));
            ps.setString(4, require(row, "quiz_title"));
            ps.setString(5, require(row, "quiz_content"));
            setBoolean(ps, 6, row.get("answer_ox"));
            ps.setString(7, require(row, "difficulty"));
            ps.setString(8, blankToNull(row.get("hint")));
            ps.setString(9, blankToNull(row.get("explanation_text")));
            ps.setTimestamp(10, toTimestamp(row.get("created_at")));
            ps.setTimestamp(11, toTimestamp(row.get("updated_at")));
        });
    }

    private List<Long> seedQuizChoices(Connection connection) throws Exception {
        String sql = """
                INSERT INTO quiz_choices (choice_id, quiz_id, choice_no, choice_text, is_answer)
                VALUES (?, ?, ?, ?, ?) AS src
                ON DUPLICATE KEY UPDATE quiz_id     = src.quiz_id,
                                        choice_no   = src.choice_no,
                                        choice_text = src.choice_text,
                                        is_answer   = src.is_answer
                """;
        return upsert(connection, "quiz_choices.csv", "choice_id", sql, (ps, row) -> {
            ps.setLong(1, requireLong(row, "choice_id"));
            ps.setLong(2, requireLong(row, "quiz_id"));
            ps.setInt(3, Integer.parseInt(require(row, "choice_no")));
            ps.setString(4, require(row, "choice_text"));
            ps.setBoolean(5, parseBoolean(require(row, "is_answer")));
        });
    }

    private List<Long> seedSurveyQuestions(Connection connection) throws Exception {
        String sql = """
                INSERT INTO survey_questions (question_id, question_text)
                VALUES (?, ?) AS src
                ON DUPLICATE KEY UPDATE question_text = src.question_text
                """;
        return upsert(connection, "survey_questions.csv", "question_id", sql, (ps, row) -> {
            ps.setLong(1, requireLong(row, "question_id"));
            ps.setString(2, require(row, "question_text"));
        });
    }

    private List<Long> seedAchievements(Connection connection) throws Exception {
        String sql = """
                INSERT INTO achievements (achievement_id, achievement_name, achievement_icon, achievement_content,
                                          achievement_category, target_value, comparison_type, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) AS src
                ON DUPLICATE KEY UPDATE achievement_name     = src.achievement_name,
                                        achievement_icon     = src.achievement_icon,
                                        achievement_content  = src.achievement_content,
                                        achievement_category = src.achievement_category,
                                        target_value         = src.target_value,
                                        comparison_type      = src.comparison_type,
                                        updated_at           = src.updated_at
                """;
        return upsert(connection, "achievements.csv", "achievement_id", sql, (ps, row) -> {
            ps.setLong(1, requireLong(row, "achievement_id"));
            ps.setString(2, require(row, "achievement_name"));
            ps.setString(3, require(row, "achievement_icon"));
            ps.setString(4, require(row, "achievement_content"));
            ps.setString(5, require(row, "achievement_category"));
            ps.setLong(6, requireLong(row, "target_value"));
            ps.setString(7, require(row, "comparison_type"));
            ps.setTimestamp(8, toTimestamp(row.get("created_at")));
            ps.setTimestamp(9, toTimestamp(row.get("updated_at")));
        });
    }

    private List<Long> upsert(Connection connection, String fileName, String idColumn, String sql, RowBinder binder)
            throws Exception {
        List<Long> ids = new ArrayList<>();
        try (Reader reader = openSeed(fileName);
             CSVParser parser = csvFormat().parse(reader);
             PreparedStatement statement = connection.prepareStatement(sql)) {

            for (CSVRecord row : parser) {
                binder.bind(statement, row);
                statement.addBatch();
                ids.add(requireLong(row, idColumn));
            }
            statement.executeBatch();
        }
        log.info("Seeded {} rows from {}", ids.size(), fileName);
        return ids;
    }

    private CSVFormat csvFormat() {
        return CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .build();
    }

    private Reader openSeed(String fileName) {
        InputStream stream = getClass().getClassLoader().getResourceAsStream(SEED_PATH + fileName);
        if (stream == null) {
            throw new FlywayException("Seed file not found on classpath: " + SEED_PATH + fileName);
        }
        return skipByteOrderMark(new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8)));
    }

    private Reader skipByteOrderMark(BufferedReader reader) {
        try {
            reader.mark(1);
            if (reader.read() != BYTE_ORDER_MARK) {
                reader.reset();
            }
        } catch (Exception e) {
            throw new FlywayException("Failed to read seed file", e);
        }
        return reader;
    }

    private byte[] readBytes(String fileName) {
        try (InputStream stream = getClass().getClassLoader().getResourceAsStream(SEED_PATH + fileName)) {
            if (stream == null) {
                throw new FlywayException("Seed file not found on classpath: " + SEED_PATH + fileName);
            }
            return stream.readAllBytes();
        } catch (Exception e) {
            throw new FlywayException("Failed to checksum seed file: " + fileName, e);
        }
    }

    private String require(CSVRecord row, String column) {
        String value = blankToNull(row.get(column));
        if (value == null) {
            throw new FlywayException("Required column '" + column + "' is empty at line " + row.getRecordNumber());
        }
        return value;
    }

    private long requireLong(CSVRecord row, String column) {
        return Long.parseLong(require(row, column));
    }

    private void setInteger(PreparedStatement statement, int index, String value) throws SQLException {
        String trimmed = blankToNull(value);
        if (trimmed == null) {
            statement.setNull(index, Types.INTEGER);
        } else {
            statement.setInt(index, Integer.parseInt(trimmed));
        }
    }

    private void setBoolean(PreparedStatement statement, int index, String value) throws SQLException {
        String trimmed = blankToNull(value);
        if (trimmed == null) {
            statement.setNull(index, Types.BOOLEAN);
        } else {
            statement.setBoolean(index, parseBoolean(trimmed));
        }
    }

    private boolean parseBoolean(String value) {
        return switch (value.trim().toUpperCase()) {
            case "TRUE", "T", "1", "O", "Y" -> true;
            case "FALSE", "F", "0", "X", "N" -> false;
            default -> throw new FlywayException("Cannot parse boolean value: " + value);
        };
    }

    private Timestamp toTimestamp(String value) {
        String trimmed = blankToNull(value);
        if (trimmed == null) {
            return Timestamp.valueOf(LocalDateTime.now());
        }
        return Timestamp.valueOf(LocalDateTime.parse(trimmed, TIMESTAMP_FORMAT));
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    @FunctionalInterface
    private interface RowBinder {
        void bind(PreparedStatement statement, CSVRecord row) throws SQLException;
    }
}
