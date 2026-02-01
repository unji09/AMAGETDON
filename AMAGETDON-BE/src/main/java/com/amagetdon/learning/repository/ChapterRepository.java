package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.Chapter;
import com.amagetdon.learning.entity.ChapterType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findAllByChapterTypeOrderByBaseChapterNoAsc(ChapterType chapterType);
    List<Chapter> findAllByChapterIdIn(Collection<Long> chapterIds);
    List<Chapter> findAllByChapterTypeOrderByChapterIdAsc(ChapterType chapterType);
    long count();
    long countByChapterType(ChapterType chapterType);
}
