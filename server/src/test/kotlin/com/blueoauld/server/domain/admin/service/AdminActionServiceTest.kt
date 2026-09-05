package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.entity.AdminAction
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.AdminActionRepository
import com.blueoauld.server.domain.member.service.MemberAdminService
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest

class AdminActionServiceTest {

    private val adminActionRepository = mockk<AdminActionRepository>()

    private val memberAdminService = mockk<MemberAdminService>()

    private val adminActionService = AdminActionService(adminActionRepository, memberAdminService)

    @Test
    fun `조치 이력에 처리자 닉네임을 붙여 준다`() {
        // given
        val actions = listOf(
            AdminAction(ACTOR_ID, AdminActionType.SUSPEND, 1000L, "SERVICE ABUSE 7일"),
            AdminAction(ACTOR_ID, AdminActionType.HANDLE_REPORT, 55L),
        )
        every {
            adminActionRepository.findAllByOrderByIdDesc(PageRequest.of(0, 20))
        } returns PageImpl(actions, PageRequest.of(0, 20), 2)
        every { memberAdminService.findNicknames(listOf(ACTOR_ID, ACTOR_ID)) } returns mapOf(ACTOR_ID to "운영자")

        // when
        val response = adminActionService.findActions(1, 20)

        // then
        assertThat(response.totalCount).isEqualTo(2)
        assertThat(response.items.map { it.action }).containsExactly(
            AdminActionType.SUSPEND,
            AdminActionType.HANDLE_REPORT,
        )
        assertThat(response.items.map { it.actorNickname }).containsOnly("운영자")
        assertThat(response.items.first().detail).isEqualTo("SERVICE ABUSE 7일")
        assertThat(response.items.last().targetId).isEqualTo(55L)
    }

    @Test
    fun `페이지와 크기는 상한 안으로 맞춘다`() {
        // given
        every {
            adminActionRepository.findAllByOrderByIdDesc(PageRequest.of(0, AdminPaging.MAX_SIZE))
        } returns PageImpl(emptyList())
        every { memberAdminService.findNicknames(emptyList()) } returns emptyMap()

        // when
        val response = adminActionService.findActions(0, 1000)

        // then
        assertThat(response.page).isEqualTo(1)
        assertThat(response.size).isEqualTo(AdminPaging.MAX_SIZE)
        assertThat(response.items).isEmpty()
    }

    companion object {

        private const val ACTOR_ID = 7L
    }
}
