package dev.codecrafter.problem.repository;

import dev.codecrafter.problem.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    List<TestCase> findByProblemIdOrderBySortOrderAsc(Long problemId);
    List<TestCase> findByProblemIdAndIsSampleOrderBySortOrderAsc(Long problemId, boolean isSample);
}
