package dev.codecrafter.challenge;

import dev.codecrafter.challenge.dto.DailyChallengeDto;
import dev.codecrafter.challenge.dto.SetDailyChallengeRequest;
import dev.codecrafter.challenge.entity.DailyChallenge;
import dev.codecrafter.challenge.repository.DailyChallengeRepository;
import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.problem.repository.ProblemRepository;
import dev.codecrafter.submission.entity.SubmissionStatus;
import dev.codecrafter.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DailyChallengeService {

    private final DailyChallengeRepository challengeRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;

    @Transactional(readOnly = true)
    public DailyChallengeDto getToday(Long viewerUserId) {
        LocalDate today = LocalDate.now();
        DailyChallenge dc = challengeRepository.findByChallengeDate(today)
            .orElseThrow(() -> ApiException.notFound("No daily challenge scheduled for today"));
        return toDto(dc, viewerUserId, today);
    }

    @Transactional(readOnly = true)
    public DailyChallengeDto getByDate(LocalDate date, Long viewerUserId) {
        DailyChallenge dc = challengeRepository.findByChallengeDate(date)
            .orElseThrow(() -> ApiException.notFound("No daily challenge for that date"));
        return toDto(dc, viewerUserId, LocalDate.now());
    }

    @Transactional
    public DailyChallengeDto set(SetDailyChallengeRequest req) {
        Problem problem = problemRepository.findById(req.problemId())
            .orElseThrow(() -> ApiException.notFound("Problem not found"));

        DailyChallenge dc = challengeRepository.findByChallengeDate(req.challengeDate())
            .orElseGet(() -> DailyChallenge.builder().challengeDate(req.challengeDate()).build());

        dc.setProblem(problem);
        if (req.bonusPoints() != null) dc.setBonusPoints(req.bonusPoints());

        return toDto(challengeRepository.save(dc), null, LocalDate.now());
    }

    private DailyChallengeDto toDto(DailyChallenge dc, Long viewerUserId, LocalDate today) {
        boolean solvedToday = false;
        if (viewerUserId != null) {
            solvedToday = submissionRepository
                .findByUserId(viewerUserId, PageRequest.of(0, 200))
                .getContent().stream()
                .anyMatch(s -> s.getProblem().getId().equals(dc.getProblem().getId())
                    && s.getVerdict() == SubmissionStatus.ACCEPTED
                    && s.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toLocalDate().equals(dc.getChallengeDate()));
        }
        Problem p = dc.getProblem();
        return new DailyChallengeDto(
            dc.getId(), dc.getChallengeDate(), dc.getBonusPoints(),
            p.getId(), p.getSlug(), p.getTitle(), p.getDifficulty().name(),
            solvedToday
        );
    }
}
