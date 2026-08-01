package com.blueoauld.server.domain.secretphoto.repository

import com.blueoauld.server.domain.secretphoto.entity.SecretPhotoAccess
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository

interface SecretPhotoAccessRepository : JpaRepository<SecretPhotoAccess, Long> {

    fun existsByOwnerIdAndViewerId(ownerId: Long, viewerId: Long): Boolean

    fun deleteByOwnerIdAndViewerId(ownerId: Long, viewerId: Long): Long

    fun findByOwnerIdAndIdLessThanOrderByIdDesc(ownerId: Long, id: Long, limit: Limit): List<SecretPhotoAccess>

    fun findByViewerIdAndIdLessThanOrderByIdDesc(viewerId: Long, id: Long, limit: Limit): List<SecretPhotoAccess>
}
