package com.blueoauld.server.global.storage.repository

import com.blueoauld.server.global.storage.entity.PhotoUpload
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface PhotoUploadRepository : JpaRepository<PhotoUpload, Long> {

    fun deleteAllByObjectKeyIn(objectKeys: List<String>)

    fun findAllByIssuedAtLessThan(issuedAt: Instant): List<PhotoUpload>
}
