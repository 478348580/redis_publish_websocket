package com.pf.org.cms.hcg.system.controller;

import java.util.Date;
import java.util.concurrent.CopyOnWriteArraySet;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;

import com.pf.org.cms.common.SpringUtils;
import com.pf.org.cms.hcg.system.publish.RedisMessageListener;
import com.pf.org.cms.hcg.system.publish.SendMessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.ReactiveRedisMessageListenerContainer;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.web.bind.annotation.RestController;


/***
 * 用“@ServerEndPoint”注解来实现，实现简单；
 */
@ServerEndpoint("/socket/{userId}/{topic}")
@RestController
public class WebsocketEndpoint {


    /***
     * 用来记录当前连接数的变量
     */
    private static volatile int onlineCount = 0;


    /***
     * concurrent包的线程安全Set，用来存放每个客户端对应的MyWebSocket对象
     */
    private static CopyOnWriteArraySet<WebsocketEndpoint> webSocketSet = new CopyOnWriteArraySet<WebsocketEndpoint>();


    /**
     * 与某个客户端的连接会话，需要通过它来与客户端进行数据收发
     */
    private Session session;

    private static final Logger LOGGER = LoggerFactory.getLogger(WebsocketEndpoint.class);


    private RedisMessageListenerContainer container = SpringUtils.getBean("container");


    private RedisMessageListener listener;

    @OnOpen
    public void onOpen(Session session, @PathParam("userId") String userId, @PathParam("topic") String topic) throws Exception {
        this.session = session;
        System.out.println(this.session.getId());
        webSocketSet.add(this);
        addOnlineCount();
        getOnlineCount();
        listener = new RedisMessageListener();
        listener.setSession(session);
        listener.setUserId(userId);
        listener.setOnlineCount(getOnlineCount());
        System.out.println(container.getClass());
        System.out.println(container.getClass().getName());
        container.addMessageListener(listener, new PatternTopic(topic));
        LOGGER.info("打开了Socket链接Open a html. userId={}, name={}", userId, topic);
    }

    @OnClose
    public void onClose() {
        webSocketSet.remove(this);
        subOnlineCount();
        getOnlineCount();
        container.removeMessageListener(listener);
        LOGGER.info("关闭了Socket链接Close a html. ");
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        getOnlineCount();
        LOGGER.info("收到一条数据消息，Receive a message from client: " + message + session.getId());
        try {
            this.sendMessage(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @OnError
    public void onError(Session session, Throwable error) {
        LOGGER.error("socket链接错误错误Error while html. ", error);
    }

    public void sendMessage(String message) throws Exception {
        if (this.session.isOpen()) {
            getOnlineCount();
            this.session.getBasicRemote().sendText("Send a message from server. " + message);
        }
    }

    public static synchronized int getOnlineCount() {
        System.out.println(new Date() + "在线人数为" + onlineCount);
        return onlineCount;
    }

    public static synchronized void addOnlineCount() {
        WebsocketEndpoint.onlineCount++;
    }

    public static synchronized void subOnlineCount() {
        WebsocketEndpoint.onlineCount--;
    }
}