package com.pf.org.cms.hcg.system.publish;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpSession;
import javax.websocket.Session;
import java.io.IOException;

/***
 * 定义一个RedisMessageListener类实现MessageListener接口，做消息订阅的处理
 */
@Component
public class RedisMessageListener implements MessageListener {

    //用户的session
    private Session session;

    //用户的ID
    private String userId;

    //在线人数
    private Integer onlineCount;

    public Integer getOnlineCount() {
        return onlineCount;
    }

    public void setOnlineCount(Integer onlineCount) {
        this.onlineCount = onlineCount;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }


    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(message.getChannel());
        String topic = new String(pattern);

        String msg = new String(message.getBody());
        if (null != session && session.isOpen()) {
            try {
                synchronized (session) {
                    msg = "用户ID是：" + userId + "您好！  您正则与: " + onlineCount + "  人在线观看，共同订阅的话题:《" + topic + "》发布了消息，内容是：《" + msg + "》";
                    System.out.println(msg);
                    session.getBasicRemote().sendText(msg);
                }
            } catch (IOException e) {
                System.out.println("发送消息异常");
            }
        } else if (userId != null) {
            System.out.println("用户:  " + userId + "  当前不在线，但是他已经订阅了，所以我们无法给他实时推出数据");

        } else {

        }
    }
}

