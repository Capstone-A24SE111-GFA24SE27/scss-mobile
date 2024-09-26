import React, { createContext, useEffect, useRef, useContext, useState } from "react";
import io from "socket.io-client";
import { AuthContext } from "./AuthContext"; // Sử dụng AuthContext để lấy thông tin người dùng
import { SocketContext } from "./SocketContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { userData, session } = useContext(AuthContext); // Lấy thông tin người dùng từ AuthContext
    const socket = useContext(SocketContext);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (userData?.id) {
            const fetchNotifications = async () => {
                try {
                    const response = await fetch('http://localhost:8080/api/notification?SortDirection=ASC&sortBy=id&page=1', {
                        headers: {
                            'Authorization': `Bearer ${session}`,
                            'Accept': 'application/json',
                        },
                    });
                    const result = await response.json();
                    if (response.ok) {
                        setNotifications(result.content.data);
                    } else {
                        console.log(result.message || 'Failed to fetch notifications');
                    }
                } catch (err) {
                    console.log(err.message || 'Failed to fetch notifications');
                } finally {
                    //   setLoading(false);
                }
            };

            fetchNotifications();

            if (socket) {
                console.log("///////////////////////NotificationContext" + userData?.id)
                socket.on(`/user/${userData?.id}/private/notification`, (data) => {
                    try {
                        // const notification = JSON.parse(data);
                        console.log(data)
                        setNotifications((prevNotifications) => [
                            data,
                            ...prevNotifications,
                        ]);
                    } catch (error) {
                        console.error("Error parsing notification:", error);
                        setError("Failed to parse notification");
                    }
                });
            }
        }

        return () => {
            if (socket) {
                socket.off(`/user/${userData?.id}/private/notification`); // Xóa lắng nghe thông báo từ socket
            }
        };
    }, [userData]);

    return (
        <NotificationContext.Provider value={{ notifications, setNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};