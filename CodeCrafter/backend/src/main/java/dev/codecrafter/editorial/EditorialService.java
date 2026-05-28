package dev.codecrafter.editorial;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.editorial.dto.EditorialDto;
import dev.codecrafter.editorial.dto.UpsertEditorialRequest;
import dev.codecrafter.editorial.entity.Editorial;
import dev.codecrafter.editorial.repository.EditorialRepository;
import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.problem.repository.ProblemRepository;
import dev.codecrafter.user.entity.User;
import dev.codecrafter.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EditorialService {

    private final EditorialRepository editorialRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public EditorialDto getPublishedEditorial(String slug) {
        Problem problem = problemRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Problem not found"));
        Editorial editorial = editorialRepository.findByProblemIdAndIsPublishedTrue(problem.getId())
            .orElseThrow(() -> ApiException.notFound("Editorial not found"));
        return toDto(editorial);
    }

    @Transactional(readOnly = true)
    public EditorialDto getEditorialForAdmin(String slug) {
        Problem problem = problemRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Problem not found"));
        Editorial editorial = editorialRepository.findByProblemId(problem.getId())
            .orElseThrow(() -> ApiException.notFound("Editorial not found"));
        return toDto(editorial);
    }

    @Transactional
    public EditorialDto upsert(String slug, UpsertEditorialRequest req, Long authorId) {
        Problem problem = problemRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Problem not found"));
        User author = userRepository.findById(authorId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        Editorial editorial = editorialRepository.findByProblemId(problem.getId())
            .orElseGet(() -> Editorial.builder().problem(problem).build());

        editorial.setContentMarkdown(req.contentMarkdown());
        editorial.setIsPublished(req.publish());
        editorial.setAuthor(author);

        return toDto(editorialRepository.save(editorial));
    }

    private EditorialDto toDto(Editorial e) {
        String authorUsername = e.getAuthor() != null ? e.getAuthor().getUsername() : null;
        return new EditorialDto(
            e.getId(), e.getProblem().getId(), authorUsername,
            e.getContentMarkdown(), e.getIsPublished(), e.getUpdatedAt()
        );
    }
}
