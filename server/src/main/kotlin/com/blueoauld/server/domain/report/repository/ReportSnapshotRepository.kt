package com.blueoauld.server.domain.report.repository

import com.blueoauld.server.domain.report.entity.ReportSnapshot
import org.springframework.data.jpa.repository.JpaRepository

interface ReportSnapshotRepository : JpaRepository<ReportSnapshot, Long>
