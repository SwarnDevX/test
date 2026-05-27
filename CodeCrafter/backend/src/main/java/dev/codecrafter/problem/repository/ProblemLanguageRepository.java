package dev.codecrafter.problem.repository;

import dev.codecrafter.problem.entity.ProblemLanguage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemLanguageRepository extends JpaRepository<ProblemLanguage, Long> {
    List<ProblemLanguage> findByProblemId(Long problemId);
    Optional<ProblemLanguage> findByProblemIdAndLanguage(Long problemId, String language);
}
