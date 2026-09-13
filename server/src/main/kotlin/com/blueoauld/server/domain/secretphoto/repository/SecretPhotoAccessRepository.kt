package com.blueoauld.server.domain.secretphoto.repository

import com.blueoauld.server.domain.block.repository.ContactBlockRepository.Companion.NOT_CONTACT_BLOCKED
import com.blueoauld.server.domain.secretphoto.entity.SecretPhotoAccess
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

    @Query(
        value = """
        select a.* from secret_photo_access a
        join member m on m.id = a.viewer_id
        where a.owner_id = :memberId
          and a.id < :cursor
          and $NOT_CONTACT_BLOCKED
        order by a.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findVisibleByOwnerId(
        @Param("memberId") memberId: Long,
        @Param("cursor") cursor: Long,
        @Param("size") size: Int,
    ): List<SecretPhotoAccess>

    @Query(
        value = """
        select a.* from secret_photo_access a
        join member m on m.id = a.owner_id
        where a.viewer_id = :memberId
          and a.id < :cursor
          and $NOT_CONTACT_BLOCKED
        order by a.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findVisibleByViewerId(
        @Param("memberId") memberId: Long,
        @Param("cursor") cursor: Long,
        @Param("size") size: Int,
    ): List<SecretPhotoAccess>
}
