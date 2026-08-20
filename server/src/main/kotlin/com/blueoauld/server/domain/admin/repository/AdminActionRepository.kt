package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.admin.entity.AdminAction
import org.springframework.data.jpa.repository.JpaRepository

interface AdminActionRepository : JpaRepository<AdminAction, Long>
