package dev.codecrafter.problem;

import dev.codecrafter.problem.entity.Difficulty;
import dev.codecrafter.problem.entity.Problem;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

class ProblemSpecifications {

    static Specification<Problem> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    static Specification<Problem> hasDifficulty(Difficulty difficulty) {
        return (root, query, cb) -> cb.equal(root.get("difficulty"), difficulty);
    }

    static Specification<Problem> hasTagSlug(String tagSlug) {
        return (root, query, cb) -> {
            query.distinct(true);
            Join<Object, Object> tagJoin = root.join("tags");
            return cb.equal(tagJoin.get("slug"), tagSlug);
        };
    }

    static Specification<Problem> hasAnyTagSlug(List<String> tagSlugs) {
        return (root, query, cb) -> {
            query.distinct(true);
            Join<Object, Object> tagJoin = root.join("tags");
            return tagJoin.get("slug").in(tagSlugs);
        };
    }

    static Specification<Problem> titleOrNumberContains(String search) {
        return (root, query, cb) -> {
            String pattern = "%" + search.toLowerCase() + "%";
            try {
                int num = Integer.parseInt(search);
                return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.equal(root.get("number"), num)
                );
            } catch (NumberFormatException ignored) {
                return cb.like(cb.lower(root.get("title")), pattern);
            }
        };
    }

    static Specification<Problem> isPremium(boolean premium) {
        return (root, query, cb) -> cb.equal(root.get("isPremium"), premium);
    }
}
