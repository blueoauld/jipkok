package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.admin.dto.projection.AdminAiMemberRow
import com.blueoauld.server.domain.ai.entity.AiPersona
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface AiMemberAdminRepository : JpaRepository<AiPersona, Long> {

    @Query(
        value = """
        select m.id as id,
               m.nickname as nickname,
               m.gender as gender,
               m.birth_year as birthYear,
               p.enabled as enabled,
               (select count(*) from member_photo ph where ph.member_id = m.id and ph.visibility = 'PUBLIC')
                 as publicPhotoCount,
               m.located_at as locatedAt,
               m.created_at as createdAt
        from ai_persona p
        join member m on m.id = p.member_id
        where $CONDITIONS
        order by m.id desc
        limit :size offset :offset
        """,
        nativeQuery = true,
    )
    fun findAllForAdmin(
        @Param("enabled") enabled: Boolean?,
        @Param("nicknameLike") nicknameLike: String?,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<AdminAiMemberRow>

    @Query(
        value = """
        select count(*)
        from ai_persona p
        join member m on m.id = p.member_id
        where $CONDITIONS
        """,
        nativeQuery = true,
    )
    fun countForAdmin(
        @Param("enabled") enabled: Boolean?,
        @Param("nicknameLike") nicknameLike: String?,
    ): Long

    companion object {

        private const val CONDITIONS = """m.deleted_at is null
          and (cast(:enabled as boolean) is null or p.enabled = cast(:enabled as boolean))
          and (cast(:nicknameLike as varchar) is null or m.nickname ilike cast(:nicknameLike as varchar))"""
    }
}
