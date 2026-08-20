package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.entity.AdminAction
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.AdminActionRepository
import org.springframework.stereotype.Component

@Component
class AdminActionRecorder(

    private val adminActionRepository: AdminActionRepository,
) {

    fun record(actorId: Long, action: AdminActionType, targetId: Long, detail: String? = null) {
        adminActionRepository.save(
            AdminAction(
                actorId = actorId,
                action = action,
                targetId = targetId,
                detail = detail?.take(AdminAction.DETAIL_MAX_LENGTH),
            ),
        )
    }
}
