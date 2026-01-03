import { useState, useEffect, useRef, useCallback } from 'react';
import { getServices } from '../services/Services';
import { 
    saveUserData, 
    getUserData, 
    clearUserData, 
    saveAvatar, 
    getAvatar, 
    getCurrentUser,
    savePassword,
    getPassword,
    clearPassword,
    isAutoLoginEnabled,
    setAutoLoginEnabled
} from '../utils/userStorage';

/**
 * Custom hook để quản lý authentication state
 */
export const useAuth = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const services = useRef(getServices());

    useEffect(() => {
        const service = services.current;
        let isMounted = true; // Flag để tránh state update sau khi unmount
        let autoLoginAttempted = false; // Flag để tránh auto login nhiều lần
        
        // Khôi phục user data từ localStorage nếu có
        const savedUserData = getCurrentUser();
        if (savedUserData && isMounted) {
            setUser(savedUserData);
        }

        // Chỉ kiểm tra trạng thái kết nối hiện tại, không tự động kết nối
        const currentState = service.getConnectionState();
        if (currentState === 'connected') {
            // Đã kết nối rồi
            if (isMounted) {
                setIsConnected(true);
                setIsLoading(false);
                setError(null);
            }
        } else if (currentState === 'connecting') {
            // Đang kết nối
            if (isMounted) {
                setIsLoading(true);
            }
        } else {
            // Disconnected - sẵn sàng kết nối khi cần
            if (isMounted) {
                setIsConnected(false);
                setIsLoading(false);
                setError(null); // Không hiển thị error khi chưa thử kết nối
            }
        }

        // Subscribe to responses
        const handleLoginResponse = (data) => {
            if (!isMounted) return;
            setIsLoading(false);
            if (data.status === 'success') {
                // Lấy avatar từ localStorage hoặc dùng default
                const savedAvatar = getAvatar();
                const userData = {
                    id: data.userId,
                    username: data.username,
                    avatar: data.avatar || savedAvatar
                };
                
                // Lưu thông tin user vào localStorage để persist
                saveUserData(userData);
                
                // Bật auto login để tự động đăng nhập lại khi reload
                setAutoLoginEnabled(true);
                
                setUser(userData);
                setError(null);
            } else {
                setError('Tài khoản hoặc mật khẩu không đúng');
                setUser(null);
                // Xóa password và tắt auto login nếu đăng nhập thất bại
                clearPassword();
                setAutoLoginEnabled(false);
            }
        };

        const handleRegisterResponse = (data) => {
            if (!isMounted) return;
            setIsLoading(false);
            if (data.status === 'success') {
                setError(null);
            } else {
                setError(data.message || 'Đăng ký thất bại');
            }
        };

        const handleError = (data) => {
            if (!isMounted) return;
            setIsLoading(false);
            setError(data.message || 'Có lỗi xảy ra');
        };

        const handleConnectionFailed = () => {
            if (!isMounted) return;
            setIsConnected(false);
            setError('Mất kết nối với server');
        };

        const handleServerShutdown = (data) => {
            if (!isMounted) return;
            console.warn('[useAuth] Server đang tắt. Đăng xuất người dùng...');
            // Services đã xóa localStorage và disconnect, chỉ cần cập nhật state
            // Gọi logout để đảm bảo state được reset đầy đủ
            setUser(null);
            setIsConnected(false);
            setIsLoading(false);
            setError(data?.message || 'Server đang tắt. Vui lòng đăng nhập lại sau.');
            // Xóa password và tắt auto login khi server shutdown
            clearPassword();
            setAutoLoginEnabled(false);
            // Services.js sẽ tự động redirect về trang đăng nhập
        };

        const handleAccountLoggedInElsewhere = (data) => {
            if (!isMounted) return;
            console.warn('[useAuth] Tài khoản đang được đăng nhập ở nơi khác. Đăng xuất...');
            // Services đã xóa localStorage và disconnect, chỉ cần cập nhật state
            setUser(null);
            setIsConnected(false);
            setIsLoading(false);
            setError(data?.message || 'Tài khoản của bạn đang được đăng nhập ở nơi khác. Vui lòng đăng nhập lại.');
            // Xóa password và tắt auto login
            clearPassword();
            setAutoLoginEnabled(false);
            // Services.js sẽ tự động redirect về trang đăng nhập
        };

        service.subscribe('login_response', handleLoginResponse);
        service.subscribe('register_response', handleRegisterResponse);
        service.subscribe('error', handleError);
        service.subscribe('connection_failed', handleConnectionFailed);
        service.subscribe('server_shutdown', handleServerShutdown);
        service.subscribe('account_logged_in_elsewhere', handleAccountLoggedInElsewhere);

        // Cleanup
        return () => {
            isMounted = false; // Đánh dấu component đã unmount
            
            // Unsubscribe các callback cụ thể
            service.unsubscribe('login_response', handleLoginResponse);
            service.unsubscribe('register_response', handleRegisterResponse);
            service.unsubscribe('error', handleError);
            service.unsubscribe('connection_failed', handleConnectionFailed);
            service.unsubscribe('server_shutdown', handleServerShutdown);
            service.unsubscribe('account_logged_in_elsewhere', handleAccountLoggedInElsewhere);
            
            // Chỉ disconnect nếu không còn subscribers nào khác
            // Điều này giúp tránh việc disconnect không cần thiết trong StrictMode
            if (service.callbacks.size === 0) {
                console.log('No more subscribers, keeping connection alive for potential reuse');
            }
        };
    }, []);

    // Ref để track auto-login đã được thử chưa
    const autoLoginAttempted = useRef(false);
    
    // Auto-login effect - tự động đăng nhập lại khi reload nếu có thông tin đã lưu
    useEffect(() => {
        const service = services.current;
        let isMounted = true;
        
        // Chỉ auto-login một lần khi component mount
        if (autoLoginAttempted.current) {
            return;
        }
        
        // Kiểm tra xem có nên tự động đăng nhập lại không
        const savedUserData = getCurrentUser();
        if (!savedUserData || !isAutoLoginEnabled()) {
            return;
        }
        
        const savedPassword = getPassword();
        if (!savedPassword || !savedUserData.username) {
            return;
        }
        
        // Kiểm tra xem đã kết nối chưa
        const currentState = service.getConnectionState();
        if (currentState === 'connected' || currentState === 'connecting') {
            // Đã kết nối hoặc đang kết nối, không cần auto-login
            return;
        }
        
        autoLoginAttempted.current = true;
        console.log('[useAuth] Tự động đăng nhập lại sau khi reload...');
        
        // Tự động kết nối và đăng nhập lại
        (async () => {
            try {
                if (isMounted) {
                    setIsLoading(true);
                    setError(null);
                }
                
                // Kết nối đến server
                await service.connect();
                
                if (isMounted) {
                    setIsConnected(true);
                }
                
                // Gọi login function (sẽ được định nghĩa sau)
                // Sử dụng service trực tiếp để tránh circular dependency
                const loginSuccess = service.login(
                    savedUserData.username,
                    savedPassword,
                    savedUserData.avatar || getAvatar()
                );
                
                if (!loginSuccess && isMounted) {
                    setIsLoading(false);
                    setError('Không thể tự động đăng nhập lại');
                    // Xóa password nếu đăng nhập thất bại
                    clearPassword();
                    setAutoLoginEnabled(false);
                }
            } catch (err) {
                console.error('[useAuth] Lỗi khi tự động đăng nhập lại:', err);
                if (isMounted) {
                    setIsLoading(false);
                    setIsConnected(false);
                    setError('Không thể kết nối đến server');
                    clearPassword();
                    setAutoLoginEnabled(false);
                }
            }
        })();
        
        return () => {
            isMounted = false;
        };
    }, []); // Chỉ chạy một lần khi mount

    const login = async (username, password, avatar) => {
        const service = services.current;
        let connectionState = service.getConnectionState();
        
        // Kết nối nếu chưa kết nối
        if (connectionState !== 'connected') {
            setIsLoading(true);
            setError(null);
            
            try {
                await service.connect();
                setIsConnected(true);
            } catch (err) {
                console.error('Connection failed:', err);
                setIsLoading(false);
                setError('Không thể kết nối đến server');
                return false;
            }
        }

        setIsLoading(true);
        setError(null);

        // Lưu password vào sessionStorage để tự động đăng nhập lại khi reload
        savePassword(password);

        const success = services.current.login(username, password, avatar);
        if (!success) {
            setIsLoading(false);
            setError('Không thể gửi yêu cầu đăng nhập');
            clearPassword(); // Xóa password nếu gửi request thất bại
            return false;
        }

        return true;
    };

    const register = async (username, password) => {
        const service = services.current;
        let connectionState = service.getConnectionState();
        
        // Kết nối nếu chưa kết nối
        if (connectionState !== 'connected') {
            setIsLoading(true);
            setError(null);
            
            try {
                await service.connect();
                setIsConnected(true);
            } catch (err) {
                console.error('Connection failed:', err);
                setIsLoading(false);
                setError('Không thể kết nối đến server');
                return false;
            }
        }

        setIsLoading(true);
        setError(null);

        const success = services.current.register(username, password);
        if (!success) {
            setIsLoading(false);
            setError('Không thể gửi yêu cầu đăng ký');
            return false;
        }

        return true;
    };

    const logout = () => {
        services.current.logout();
        // Xóa user data khỏi localStorage nhưng giữ lại avatar
        clearUserData();
        // Xóa password và tắt auto login khi logout
        clearPassword();
        setAutoLoginEnabled(false);
        setUser(null);
        setError(null);
    };

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const updateAvatar = useCallback((newAvatar) => {
        // Lưu avatar vào localStorage
        saveAvatar(newAvatar);
        
        // Cập nhật user state nếu đang đăng nhập
        if (user) {
            const updatedUser = { ...user, avatar: newAvatar };
            setUser(updatedUser);
            saveUserData(updatedUser);
        }
    }, [user]);

    return {
        // State
        isConnected,
        isLoading,
        user,
        error,
        isAuthenticated: !!user,

        // Actions
        login,
        register,
        logout,
        clearError,
        updateAvatar,

        // Utils
        connectionInfo: services.current.getConnectionInfo()
    };
};

export default useAuth;