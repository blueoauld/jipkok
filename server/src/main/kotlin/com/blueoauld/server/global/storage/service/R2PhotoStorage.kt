package com.blueoauld.server.global.storage.service

import com.blueoauld.server.global.properties.R2Properties
import com.blueoauld.server.global.storage.dto.StoredObject
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.CopyObjectRequest
import software.amazon.awssdk.services.s3.model.Delete
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.HeadObjectRequest
import software.amazon.awssdk.services.s3.model.NoSuchKeyException
import software.amazon.awssdk.services.s3.model.ObjectIdentifier
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest
import java.net.URI
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnProperty(prefix = "r2", name = ["enabled"], havingValue = "true")
class R2PhotoStorage(

    private val r2Properties: R2Properties,
) : PhotoStorage {

    private val credentials = StaticCredentialsProvider.create(
        AwsBasicCredentials.create(r2Properties.accessKeyId, r2Properties.secretAccessKey),
    )

    private val presigner: S3Presigner = S3Presigner.builder()
        .endpointOverride(URI.create(r2Properties.endpoint))
        .credentialsProvider(credentials)
        .region(REGION)
        .build()

    private val client: S3Client = S3Client.builder()
        .endpointOverride(URI.create(r2Properties.endpoint))
        .credentialsProvider(credentials)
        .region(REGION)
        .overrideConfiguration {
            it.apiCallTimeout(API_CALL_TIMEOUT)
            it.apiCallAttemptTimeout(API_CALL_ATTEMPT_TIMEOUT)
        }
        .build()

    override fun createUploadUrl(objectKey: String, contentType: String): String {
        val putObject = PutObjectRequest.builder()
            .bucket(r2Properties.bucket)
            .key(objectKey)
            .contentType(contentType)
            .build()

        val presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(r2Properties.uploadUrlValidity)
            .putObjectRequest(putObject)
            .build()

        return presigner.presignPutObject(presignRequest).url().toString()
    }

    override fun toPublicUrl(objectKey: String) = "${r2Properties.publicBaseUrl}/$objectKey"

    override fun createSignedViewUrl(objectKey: String) = createSignedViewUrl(objectKey, r2Properties.viewUrlValidity)

    override fun createSignedViewUrl(objectKey: String, validity: Duration): String {
        val getObject = GetObjectRequest.builder()
            .bucket(r2Properties.bucket)
            .key(objectKey)
            .build()

        val presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(validity)
            .getObjectRequest(getObject)
            .build()

        return presigner.presignGetObject(presignRequest).url().toString()
    }

    override fun head(objectKey: String): StoredObject? = runCatching {
        client.headObject(HeadObjectRequest.builder().bucket(r2Properties.bucket).key(objectKey).build())
    }.map { StoredObject(it.contentLength(), it.contentType()) }
        .recover { if (it is NoSuchKeyException) null else throw it }
        .getOrThrow()

    override fun copy(sourceKey: String, targetKey: String) {
        client.copyObject(
            CopyObjectRequest.builder()
                .sourceBucket(r2Properties.bucket)
                .sourceKey(sourceKey)
                .destinationBucket(r2Properties.bucket)
                .destinationKey(targetKey)
                .build(),
        )
    }

    override fun delete(objectKeys: List<String>) {
        objectKeys.chunked(DELETE_BATCH_SIZE).forEach { chunk ->
            val delete = Delete.builder()
                .objects(chunk.map { ObjectIdentifier.builder().key(it).build() })
                .build()

            val errors = client.deleteObjects(
                DeleteObjectsRequest.builder()
                    .bucket(r2Properties.bucket)
                    .delete(delete)
                    .build(),
            ).errors()

            if (errors.isNotEmpty()) {
                log.error { "사진 일부를 지우지 못했다. errors=${errors.map { "${it.key()}(${it.code()})" }}" }
            }
        }
    }

    companion object {

        private val REGION: Region = Region.of("auto")

        private const val DELETE_BATCH_SIZE = 1000

        private val API_CALL_ATTEMPT_TIMEOUT: Duration = Duration.ofSeconds(5)
        private val API_CALL_TIMEOUT: Duration = Duration.ofSeconds(10)
    }
}
