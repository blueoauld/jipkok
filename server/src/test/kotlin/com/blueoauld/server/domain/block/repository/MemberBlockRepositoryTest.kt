package com.blueoauld.server.domain.block.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.block.entity.MemberBlock
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class MemberBlockRepositoryTest {

    @Autowired
    private lateinit var memberBlockRepository: MemberBlockRepository

    @Test
    fun `내가 차단했으면 차단 관계로 본다`() {
        // given
        memberBlockRepository.saveAndFlush(MemberBlock(ME_ID, OTHER_ID))

        // when, then
        assertThat(memberBlockRepository.existsBetween(ME_ID, OTHER_ID)).isTrue()
    }

    @Test
    fun `상대가 나를 차단했어도 차단 관계로 본다`() {
        // given
        memberBlockRepository.saveAndFlush(MemberBlock(OTHER_ID, ME_ID))

        // when, then
        assertThat(memberBlockRepository.existsBetween(ME_ID, OTHER_ID)).isTrue()
    }

    @Test
    fun `양쪽 다 차단하지 않았으면 차단 관계가 아니다`() {
        // given
        memberBlockRepository.saveAndFlush(MemberBlock(ME_ID, THIRD_ID))

        // when, then
        assertThat(memberBlockRepository.existsBetween(ME_ID, OTHER_ID)).isFalse()
    }

    companion object {

        private const val ME_ID = 1L
        private const val OTHER_ID = 2L
        private const val THIRD_ID = 3L
    }
}
