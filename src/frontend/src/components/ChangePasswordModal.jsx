import React, { useState, useEffect } from 'react';
import { getServices } from '../services/Services';
import { validators } from '../utils/validation';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import './ChangePasswordModal.css';

export default function ChangePasswordModal({ show, onClose }) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  // Reset form khi modal đóng/mở
  useEffect(() => {
    if (!show) {
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
      setMessage({ text: '', type: '' });
      setShowPasswords({ oldPassword: false, newPassword: false, confirmPassword: false });
    }
  }, [show]);

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Close modal khi ấn ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [show, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error khi user bắt đầu nhập lại
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear message khi user bắt đầu nhập lại
    if (message.text) {
      setMessage({ text: '', type: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Vui lòng nhập mật khẩu cũ';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else {
      const passwordError = validators.password(formData.newPassword);
      if (passwordError) {
        newErrors.newPassword = passwordError;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu cũ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    setErrors({});

    try {
      const services = getServices();
      const response = await services.changePassword(
        formData.oldPassword,
        formData.newPassword
      );

      if (response && response.status === 'success') {
        setMessage({ 
          text: response.message || 'Đổi mật khẩu thành công!', 
          type: 'success' 
        });
        // Reset form sau 1.5 giây và đóng modal
        setTimeout(() => {
          setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
          onClose();
        }, 1500);
      } else {
        setMessage({ 
          text: response?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.', 
          type: 'error' 
        });
      }
    } catch (err) {
      console.error('[ChangePasswordModal] Failed to change password:', err);
      setMessage({ 
        text: err.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý click outside modal
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('change-password-modal-backdrop')) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="change-password-modal-backdrop" onClick={handleBackdropClick}>
      <div className="change-password-modal">
        <button className="change-password-close-btn" onClick={onClose}>✕</button>
        
        <h2 className="change-password-title">Đổi Mật Khẩu</h2>
        
        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="change-password-form-group">
            <label htmlFor="oldPassword">Mật khẩu cũ</label>
            <div className="change-password-input-wrapper">
              <input
                type={showPasswords.oldPassword ? 'text' : 'password'}
                id="oldPassword"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleInputChange}
                className={errors.oldPassword ? 'error' : ''}
                disabled={loading}
                placeholder="Nhập mật khẩu cũ"
              />
              <button
                type="button"
                className="change-password-toggle-btn"
                onClick={() => togglePasswordVisibility('oldPassword')}
                disabled={loading}
                aria-label={showPasswords.oldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPasswords.oldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPasswords.oldPassword ? (
                  <VisibilityOffIcon className="change-password-icon" />
                ) : (
                  <VisibilityIcon className="change-password-icon" />
                )}
              </button>
            </div>
            {errors.oldPassword && (
              <span className="change-password-error">{errors.oldPassword}</span>
            )}
          </div>

          <div className="change-password-form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <div className="change-password-input-wrapper">
              <input
                type={showPasswords.newPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={errors.newPassword ? 'error' : ''}
                disabled={loading}
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                className="change-password-toggle-btn"
                onClick={() => togglePasswordVisibility('newPassword')}
                disabled={loading}
                aria-label={showPasswords.newPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPasswords.newPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPasswords.newPassword ? (
                  <VisibilityOffIcon className="change-password-icon" />
                ) : (
                  <VisibilityIcon className="change-password-icon" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <span className="change-password-error">{errors.newPassword}</span>
            )}
          </div>

          <div className="change-password-form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
            <div className="change-password-input-wrapper">
              <input
                type={showPasswords.confirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
                disabled={loading}
                placeholder="Nhập lại mật khẩu mới"
              />
              <button
                type="button"
                className="change-password-toggle-btn"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                disabled={loading}
                aria-label={showPasswords.confirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPasswords.confirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPasswords.confirmPassword ? (
                  <VisibilityOffIcon className="change-password-icon" />
                ) : (
                  <VisibilityIcon className="change-password-icon" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="change-password-error">{errors.confirmPassword}</span>
            )}
          </div>

          {message.text && (
            <div className={`change-password-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="change-password-form-actions">
            <button
              type="button"
              onClick={onClose}
              className="change-password-btn change-password-btn-cancel"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="change-password-btn change-password-btn-submit"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

