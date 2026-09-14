package com.blueoauld.server.domain.ai.repository

import com.blueoauld.server.domain.ai.entity.AiRoomMemory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query

interface AiRoomMemoryRepository : JpaRepository<AiRoomMemory, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = """
        delete from ai_room_memory m
        where not exists (select 1 from chat_room r where r.id = m.room_id)
        """,
        nativeQuery = true,
    )
    fun deleteOrphans(): Int
}
