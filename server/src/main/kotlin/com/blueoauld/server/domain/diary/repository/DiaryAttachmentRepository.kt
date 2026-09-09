package com.blueoauld.server.domain.diary.repository

import com.blueoauld.server.domain.diary.entity.DiaryAttachment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface DiaryAttachmentRepository : JpaRepository<DiaryAttachment, Long> {

    fun findAllByDiaryIdOrderByPosition(diaryId: Long): List<DiaryAttachment>

    fun findAllByDiaryIdInOrderByPosition(diaryIds: Collection<Long>): List<DiaryAttachment>

    @Query(
        value = """
        select a.object_key
        from diary_attachment a
        join diary d on d.id = a.diary_id
        where d.member_id = :memberId
        union all
        select a.thumbnail_object_key
        from diary_attachment a
        join diary d on d.id = a.diary_id
        where d.member_id = :memberId and a.thumbnail_object_key is not null
        """,
        nativeQuery = true,
    )
    fun findObjectKeysByMemberId(@Param("memberId") memberId: Long): List<String>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = """
        delete from diary_attachment a
        using diary d
        where d.id = a.diary_id and d.member_id = :memberId
        """,
        nativeQuery = true,
    )
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)
}
