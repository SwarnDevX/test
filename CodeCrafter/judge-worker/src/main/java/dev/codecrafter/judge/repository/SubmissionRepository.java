package dev.codecrafter.judge.repository;

import dev.codecrafter.judge.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {}
