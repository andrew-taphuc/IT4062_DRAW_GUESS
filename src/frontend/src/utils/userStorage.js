/**
 * Utility functions để quản lý user data và avatar trong localStorage
 */

const USER_DATA_KEY = 'user_data';
const AVATAR_KEY = 'user_avatar';
const AUTO_LOGIN_KEY = 'auto_login_enabled'; // Flag để bật/tắt auto login
const PASSWORD_KEY = 'user_password'; // Lưu trong localStorage khi auto_login_enabled = true

/**
 * Lưu user data vào localStorage
 */
export const saveUserData = (userData) => {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

/**
 * Lấy user data từ localStorage
 */
export const getUserData = () => {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Xóa user data khỏi localStorage
 */
export const clearUserData = () => {
  try {
    localStorage.removeItem(USER_DATA_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};

/**
 * Lưu avatar vào localStorage
 */
export const saveAvatar = (avatar) => {
  try {
    localStorage.setItem(AVATAR_KEY, avatar);
    return true;
  } catch (error) {
    console.error('Error saving avatar:', error);
    return false;
  }
};

/**
 * Lấy avatar từ localStorage
 */
export const getAvatar = () => {
  try {
    return localStorage.getItem(AVATAR_KEY) || 'avt1.jpg';
  } catch (error) {
    console.error('Error getting avatar:', error);
    return 'avt1.jpg';
  }
};

/**
 * Kiểm tra xem user đã đăng nhập chưa
 */
export const isUserLoggedIn = () => {
  const userData = getUserData();
  return userData && userData.username && userData.id;
};

/**
 * Lấy thông tin user hiện tại
 */
export const getCurrentUser = () => {
  const userData = getUserData();
  if (!userData) return null;
  
  return {
    ...userData,
    avatar: userData.avatar || getAvatar()
  };
};

/**
 * Lưu password để tự động đăng nhập lại
 * - Nếu auto_login_enabled = true: lưu vào localStorage (tồn tại vĩnh viễn cho đến khi logout)
 * - Nếu auto_login_enabled = false: lưu vào sessionStorage (chỉ tồn tại trong phiên tab)
 */
export const savePassword = (password) => {
  try {
    const autoLoginEnabled = isAutoLoginEnabled();
    if (autoLoginEnabled) {
      // Lưu vào localStorage để tồn tại kể cả khi đóng tab
      localStorage.setItem(PASSWORD_KEY, password);
    } else {
      // Lưu vào sessionStorage (chỉ tồn tại trong phiên tab)
      sessionStorage.setItem(PASSWORD_KEY, password);
    }
    return true;
  } catch (error) {
    console.error('Error saving password:', error);
    return false;
  }
};

/**
 * Lấy password từ storage
 * Ưu tiên đọc từ localStorage (nếu auto_login_enabled = true)
 * Nếu không có, đọc từ sessionStorage (tương thích ngược)
 */
export const getPassword = () => {
  try {
    // Ưu tiên đọc từ localStorage
    const passwordFromLocal = localStorage.getItem(PASSWORD_KEY);
    if (passwordFromLocal) {
      return passwordFromLocal;
    }
    // Nếu không có, đọc từ sessionStorage (tương thích ngược)
    return sessionStorage.getItem(PASSWORD_KEY);
  } catch (error) {
    console.error('Error getting password:', error);
    return null;
  }
};

/**
 * Xóa password khỏi cả localStorage và sessionStorage
 */
export const clearPassword = () => {
  try {
    localStorage.removeItem(PASSWORD_KEY);
    sessionStorage.removeItem(PASSWORD_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing password:', error);
    return false;
  }
};

/**
 * Bật/tắt chế độ tự động đăng nhập
 * Khi bật: di chuyển password từ sessionStorage sang localStorage (nếu có)
 * Khi tắt: di chuyển password từ localStorage sang sessionStorage (nếu có)
 */
export const setAutoLoginEnabled = (enabled) => {
  try {
    if (enabled) {
      localStorage.setItem(AUTO_LOGIN_KEY, 'true');
      // Di chuyển password từ sessionStorage sang localStorage nếu có
      const passwordFromSession = sessionStorage.getItem(PASSWORD_KEY);
      if (passwordFromSession) {
        localStorage.setItem(PASSWORD_KEY, passwordFromSession);
        sessionStorage.removeItem(PASSWORD_KEY);
      }
    } else {
      localStorage.removeItem(AUTO_LOGIN_KEY);
      // Di chuyển password từ localStorage sang sessionStorage nếu có
      const passwordFromLocal = localStorage.getItem(PASSWORD_KEY);
      if (passwordFromLocal) {
        sessionStorage.setItem(PASSWORD_KEY, passwordFromLocal);
        localStorage.removeItem(PASSWORD_KEY);
      }
    }
    return true;
  } catch (error) {
    console.error('Error setting auto login:', error);
    return false;
  }
};

/**
 * Kiểm tra xem auto login có được bật không
 */
export const isAutoLoginEnabled = () => {
  try {
    return localStorage.getItem(AUTO_LOGIN_KEY) === 'true';
  } catch (error) {
    console.error('Error checking auto login:', error);
    return false;
  }
};