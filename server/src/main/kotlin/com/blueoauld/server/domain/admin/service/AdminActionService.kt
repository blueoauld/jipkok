package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.response.AdminActionPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminActionResponse
import com.blueoauld.server.domain.admin.repository.AdminActionRepository
import com.blueoauld.server.domain.member.service.MemberAdminService
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AdminActionService(

    private val adminActionRepository: AdminActionRepository,
    private val memberAdminService: MemberAdminService,
) {

    @Transactional(readOnly = true)
    fun findActions(page: Int, size: Int): AdminActionPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)

        val actions = adminActionRepository.findAllByOrderByIdDesc(PageRequest.of(safePage - 1, safeSize))
        val nicknames = memberAdminService.findNicknames(actions.content.map { it.actorId })

        return AdminActionPageResponse(
            items = actions.content.map {
                AdminActionResponse(
                    id = it.id,
                    actorId = it.actorId,
                    actorNickname = nicknames.getValue(it.actorId),
                    action = it.action,
                    targetId = it.targetId,
                    detail = it.detail,
                    createdAt = it.createdAt,
                )
            },
            page = safePage,
            size = safeSize,
            totalCount = actions.totalElements,
        )
    }
}
