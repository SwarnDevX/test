package dev.codecrafter.problem.repository;

import dev.codecrafter.problem.entity.SampleTestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SampleTestCaseRepository extends JpaRepository<SampleTestCase, Long> {
    List<SampleTestCase> findByProblemIdOrderBySortOrderAsc(Long problemId);
}
