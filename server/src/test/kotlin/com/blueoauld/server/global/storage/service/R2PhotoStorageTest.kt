package com.blueoauld.server.global.storage.service

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.read.ListAppender
import com.blueoauld.server.global.properties.R2Properties
import com.sun.net.httpserver.HttpServer
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory
import java.net.InetAddress
import java.net.InetSocketAddress
import java.time.Duration

class R2PhotoStorageTest {

    private lateinit var server: HttpServer

    private lateinit var storage: R2PhotoStorage

    private val logger = LoggerFactory.getLogger(R2PhotoStorage::class.java) as Logger

    private val appender = ListAppender<ILoggingEvent>()

    private var deleteResult = ""

    @BeforeEach
    fun setUp() {
        server = HttpServer.create(InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0)
        server.createContext("/") { exchange ->
            exchange.requestBody.use { it.readAllBytes() }
            val body = deleteResult.toByteArray()
            exchange.responseHeaders.add("Content-Type", "application/xml")
            exchange.sendResponseHeaders(200, body.size.toLong())
            exchange.responseBody.use { it.write(body) }
        }
        server.start()

        storage = R2PhotoStorage(properties("http://127.0.0.1:${server.address.port}"))
        appender.start()
        logger.addAppender(appender)
    }

    @AfterEach
    fun tearDown() {
        logger.detachAppender(appender)
        server.stop(0)
    }

    @Test
    fun `일괄 삭제에서 지우지 못한 키가 있으면 키와 사유를 에러로 남긴다`() {
        // given
        deleteResult = deleteResult(
            "<Deleted><Key>$DELETED_KEY</Key></Deleted>",
            "<Error><Key>$FAILED_KEY</Key><Code>InternalError</Code><Message>failed</Message></Error>",
        )

        // when
        storage.delete(listOf(DELETED_KEY, FAILED_KEY))

        // then
        val event = appender.list.single()
        assertThat(event.level).isEqualTo(Level.ERROR)
        assertThat(event.formattedMessage).contains(FAILED_KEY, "InternalError").doesNotContain(DELETED_KEY)
    }

    @Test
    fun `모두 지웠으면 로그를 남기지 않는다`() {
        // given
        deleteResult = deleteResult("<Deleted><Key>$DELETED_KEY</Key></Deleted>")

        // when
        storage.delete(listOf(DELETED_KEY))

        // then
        assertThat(appender.list).isEmpty()
    }

    private fun deleteResult(vararg entries: String) =
        """<?xml version="1.0" encoding="UTF-8"?>""" +
            """<DeleteResult xmlns="$S3_NAMESPACE">""" +
            entries.joinToString("") +
            "</DeleteResult>"

    private fun properties(endpoint: String) = R2Properties(
        endpoint = endpoint,
        accessKeyId = "access-key",
        secretAccessKey = "secret-key",
        bucket = "bucket",
        publicBaseUrl = "https://photos.example.com",
        uploadUrlValidity = Duration.ofMinutes(5),
        viewUrlValidity = Duration.ofMinutes(5),
    )

    companion object {

        private const val DELETED_KEY = "members/1/deleted.webp"
        private const val FAILED_KEY = "members/1/failed.webp"
        private const val S3_NAMESPACE = "http://s3.amazonaws.com/doc/2006-03-01/"
    }
}
