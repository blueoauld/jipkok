package com.blueoauld.server.domain.report.repository

import com.blueoauld.server.domain.report.entity.Report
import org.springframework.data.jpa.repository.JpaRepository

interface ReportRepository : JpaRepository<Report, Long>
