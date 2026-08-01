package com.blueoauld.server.domain.member.service

import com.blueoauld.server.global.properties.R2Properties
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.Delete
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest
import software.amazon.awssdk.services.s3.model.ObjectIdentifier
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest
import java.net.URI

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

    override fun delete(objectKeys: List<String>) {
        if (objectKeys.isEmpty()) {
            return
        }

        val delete = Delete.builder()
            .objects(objectKeys.map { ObjectIdentifier.builder().key(it).build() })
            .build()

        client.deleteObjects(
            DeleteObjectsRequest.builder()
                .bucket(r2Properties.bucket)
                .delete(delete)
                .build(),
        )
    }

    companion object {

        private val REGION: Region = Region.of("auto")
    }
}
