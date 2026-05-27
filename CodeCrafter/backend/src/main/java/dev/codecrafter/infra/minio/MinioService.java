package dev.codecrafter.infra.minio;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${app.minio.bucket.avatars}")
    private String avatarsBucket;

    @Value("${app.minio.bucket.editorials}")
    private String editorialsBucket;

    @Value("${app.minio.bucket.submissions}")
    private String submissionsBucket;

    @EventListener(ApplicationReadyEvent.class)
    public void initBuckets() {
        List.of(avatarsBucket, editorialsBucket, submissionsBucket)
            .forEach(this::ensureBucketExists);
    }

    private void ensureBucketExists(String bucket) {
        try {
            boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Created MinIO bucket: {}", bucket);
            }
        } catch (Exception e) {
            log.warn("Could not initialize MinIO bucket '{}': {}", bucket, e.getMessage());
        }
    }

    public String generateAvatarUploadUrl(String objectKey) {
        return generatePresignedPutUrl(avatarsBucket, objectKey);
    }

    public String getAvatarPublicUrl(String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(avatarsBucket)
                    .object(objectKey)
                    .expiry(7, TimeUnit.DAYS)
                    .build());
        } catch (Exception e) {
            log.error("Failed to generate avatar URL for key {}", objectKey, e);
            return null;
        }
    }

    private String generatePresignedPutUrl(String bucket, String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.PUT)
                    .bucket(bucket)
                    .object(objectKey)
                    .expiry(10, TimeUnit.MINUTES)
                    .build());
        } catch (Exception e) {
            log.error("Failed to generate presigned PUT URL for {}/{}", bucket, objectKey, e);
            throw new RuntimeException("Failed to generate upload URL", e);
        }
    }
}
