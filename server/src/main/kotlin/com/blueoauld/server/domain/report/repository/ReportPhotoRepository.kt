package com.blueoauld.server.domain.report.repository

import com.blueoauld.server.domain.report.entity.ReportPhoto
import org.springframework.data.jpa.repository.JpaRepository

interface ReportPhotoRepository : JpaRepository<ReportPhoto, Long>
