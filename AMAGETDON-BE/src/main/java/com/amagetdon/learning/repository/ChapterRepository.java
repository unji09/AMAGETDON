package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.Chapter;
import com.amagetdon.learning.entity.ChapterType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findAllByChapterTypeOrderByBaseChapterNoAsc(ChapterType chapterType);
}
