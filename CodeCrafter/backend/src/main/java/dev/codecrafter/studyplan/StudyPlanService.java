package dev.codecrafter.studyplan;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.problem.repository.ProblemRepository;
import dev.codecrafter.stats.BadgeEngine;
import dev.codecrafter.studyplan.dto.*;
import dev.codecrafter.studyplan.entity.StudyPlan;
import dev.codecrafter.studyplan.entity.StudyPlanProblem;
import dev.codecrafter.studyplan.entity.UserStudyPlanProgress;
import dev.codecrafter.studyplan.repository.StudyPlanProblemRepository;
import dev.codecrafter.studyplan.repository.StudyPlanRepository;
import dev.codecrafter.studyplan.repository.UserStudyPlanProgressRepository;
import dev.codecrafter.user.entity.User;
import dev.codecrafter.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StudyPlanService {

    private final StudyPlanRepository planRepository;
    private final StudyPlanProblemRepository planProblemRepository;
    private final UserStudyPlanProgressRepository progressRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final BadgeEngine badgeEngine;

    // ── Public API ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<StudyPlanSummaryDto> listPublished(Long viewerUserId) {
        return planRepository.findByIsPublishedTrueOrderByCreatedAtAsc()
            .stream().map(p -> toSummary(p, viewerUserId)).toList();
    }

    @Transactional(readOnly = true)
    public StudyPlanDetailDto getDetail(String slug, Long viewerUserId) {
        StudyPlan plan = planRepository.findBySlugAndIsPublishedTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Study plan not found"));
        return toDetail(plan, viewerUserId);
    }

    /** Called from StatsSyncService when user gets AC on a problem. Auto-tracks progress in any plans containing that problem. */
    @Transactional
    public void onProblemSolved(Long userId, Long problemId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Problem problem = problemRepository.findById(problemId).orElse(null);
        if (problem == null) return;

        planProblemRepository.findByProblemId(problemId).forEach(spp -> {
            StudyPlan plan = spp.getPlan();
            if (!plan.getIsPublished()) return;

            if (!progressRepository.existsByUserIdAndPlanIdAndProblemId(userId, plan.getId(), problemId)) {
                progressRepository.save(UserStudyPlanProgress.builder()
                    .user(user).plan(plan).problem(problem).build());

                // Check plan completion
                long completed = progressRepository.countByUserIdAndPlanId(userId, plan.getId());
                long total = planProblemRepository.countByPlanId(plan.getId());
                if (total > 0 && completed >= total) {
                    badgeEngine.awardBadge(userId, "plan-" + plan.getSlug());
                }
            }
        });
    }

    // ── Admin API ─────────────────────────────────────────────────────────────

    @Transactional
    public StudyPlanSummaryDto create(CreateStudyPlanRequest req) {
        if (planRepository.findBySlug(req.slug()).isPresent()) {
            throw ApiException.conflict("Study plan slug already exists");
        }
        StudyPlan plan = StudyPlan.builder()
            .slug(req.slug()).title(req.title()).description(req.description())
            .icon(req.icon())
            .difficulty(req.difficulty() != null ? req.difficulty().toUpperCase() : "MIXED")
            .estimatedDays(req.estimatedDays())
            .isPublished(req.publish())
            .build();
        return toSummary(planRepository.save(plan), null);
    }

    @Transactional
    public StudyPlanSummaryDto update(String slug, CreateStudyPlanRequest req) {
        StudyPlan plan = planRepository.findBySlug(slug)
            .orElseThrow(() -> ApiException.notFound("Study plan not found"));
        plan.setTitle(req.title());
        plan.setDescription(req.description());
        plan.setIcon(req.icon());
        if (req.difficulty() != null) plan.setDifficulty(req.difficulty().toUpperCase());
        plan.setEstimatedDays(req.estimatedDays());
        plan.setIsPublished(req.publish());
        return toSummary(planRepository.save(plan), null);
    }

    @Transactional
    public StudyPlanDetailDto addProblem(String slug, AddPlanProblemRequest req) {
        StudyPlan plan = planRepository.findBySlug(slug)
            .orElseThrow(() -> ApiException.notFound("Study plan not found"));
        Problem problem = problemRepository.findById(req.problemId())
            .orElseThrow(() -> ApiException.notFound("Problem not found"));

        if (planProblemRepository.existsByPlanIdAndProblemId(plan.getId(), problem.getId())) {
            throw ApiException.conflict("Problem already in plan");
        }

        int orderIndex = req.orderIndex() != null ? req.orderIndex()
            : (int) planProblemRepository.countByPlanId(plan.getId());

        planProblemRepository.save(StudyPlanProblem.builder()
            .plan(plan).problem(problem)
            .orderIndex(orderIndex).notes(req.notes()).build());

        plan.setProblemCount((int) planProblemRepository.countByPlanId(plan.getId()));
        planRepository.save(plan);

        return toDetail(plan, null);
    }

    @Transactional
    public void removeProblem(String slug, Long problemId) {
        StudyPlan plan = planRepository.findBySlug(slug)
            .orElseThrow(() -> ApiException.notFound("Study plan not found"));
        planProblemRepository.deleteByPlanIdAndProblemId(plan.getId(), problemId);
        plan.setProblemCount((int) planProblemRepository.countByPlanId(plan.getId()));
        planRepository.save(plan);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private StudyPlanSummaryDto toSummary(StudyPlan plan, Long viewerUserId) {
        int completed = viewerUserId == null ? 0
            : (int) progressRepository.countByUserIdAndPlanId(viewerUserId, plan.getId());
        int total = plan.getProblemCount();
        int pct = total > 0 ? (completed * 100 / total) : 0;
        return new StudyPlanSummaryDto(
            plan.getId(), plan.getSlug(), plan.getTitle(), plan.getDescription(),
            plan.getIcon(), plan.getDifficulty(), total, plan.getEstimatedDays(),
            completed, pct
        );
    }

    private StudyPlanDetailDto toDetail(StudyPlan plan, Long viewerUserId) {
        Set<Long> completedIds = viewerUserId == null
            ? Set.of()
            : progressRepository.findCompletedProblemIds(viewerUserId, plan.getId());

        List<StudyPlanProblemDto> problems = planProblemRepository
            .findByPlanIdOrderByOrderIndexAsc(plan.getId())
            .stream().map(spp -> {
                Problem p = spp.getProblem();
                return new StudyPlanProblemDto(
                    p.getId(), p.getNumber(), p.getTitle(), p.getSlug(),
                    p.getDifficulty().name(), spp.getOrderIndex(), spp.getNotes(),
                    completedIds.contains(p.getId())
                );
            }).toList();

        int completed = completedIds.size();
        int total = plan.getProblemCount();
        int pct = total > 0 ? (completed * 100 / total) : 0;

        return new StudyPlanDetailDto(
            plan.getId(), plan.getSlug(), plan.getTitle(), plan.getDescription(),
            plan.getIcon(), plan.getDifficulty(), total, plan.getEstimatedDays(),
            completed, pct, problems
        );
    }
}
