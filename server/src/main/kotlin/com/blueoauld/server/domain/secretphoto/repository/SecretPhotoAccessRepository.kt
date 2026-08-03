package com.blueoauld.server.domain.secretphoto.repository

import com.blueoauld.server.domain.secretphoto.entity.SecretPhotoAccess
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface SecretPhotoAccessRepository : JpaRepository<SecretPhotoAccess, Long> {

    fun existsByOwnerIdAndViewerId(ownerId: Long, viewerId: Long): Boolean

    fun deleteByOwnerIdAndViewerId(ownerId: Long, viewerId: Long): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from SecretPhotoAccess a where a.ownerId = :memberId or a.viewerId = :memberId")
    fun deleteAllByMember(@Param("memberId") memberId: Long)

    fun findByOwnerIdAndIdLessThanOrderByIdDesc(ownerId: Long, id: Long, limit: Limit): List<SecretPhotoAccess>

    fun findByViewerIdAndIdLessThanOrderByIdDesc(viewerId: Long, id: Long, limit: Limit): List<SecretPhotoAccess>
}
