package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.domain.member.entity.MemberPhoto
import org.springframework.data.jpa.repository.JpaRepository

interface MemberPhotoRepository : JpaRepository<MemberPhoto, Long> {

    fun deleteAllByMemberId(memberId: Long)
}
