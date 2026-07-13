import { useState, useEffect } from "react";

/**
 * Key để lưu API Key trong localStorage
 */
const STORAGE_KEY = "USER_GEMINI_API_KEY";

/**
 * Hook quản lý Gemini API Key trong localStorage
 * Tuân thủ BYOK (Bring Your Own Key) pattern
 *
 * @returns {Object} Object chứa apiKey, setApiKey, và hasKey
 */
export const useGeminiKey = () => {
  const defaultKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  
  const [apiKey, setApiKeyState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || defaultKey;
  });

  /**
   * Load API Key từ localStorage khi component mount
   * Lắng nghe storage event để tự động cập nhật khi key thay đổi
   */
  useEffect(() => {
    const loadKey = () => {
      const savedKey = localStorage.getItem(STORAGE_KEY);
      if (savedKey) {
        setApiKeyState(savedKey);
      } else if (defaultKey) {
        setApiKeyState(defaultKey);
      } else {
        setApiKeyState("");
      }
    };

    // Load key lần đầu
    loadKey();

    // Lắng nghe storage event để tự động cập nhật
    window.addEventListener("storage", loadKey);
    window.addEventListener("apiKeyUpdated", loadKey);

    return () => {
      window.removeEventListener("storage", loadKey);
      window.removeEventListener("apiKeyUpdated", loadKey);
    };
  }, []);

  /**
   * Set API Key và lưu vào localStorage
   * Tự động reload state để cập nhật UI ngay lập tức
   *
   * @param {string} key - API Key cần lưu
   */
  const setApiKey = (key) => {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
      setApiKeyState(key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setApiKeyState("");
    }
    // Trigger re-render bằng cách dispatch custom event
    window.dispatchEvent(new Event("apiKeyUpdated"));
  };

  /**
   * Kiểm tra xem đã có API Key chưa
   */
  const hasKey = Boolean(apiKey);

  return {
    apiKey,
    setApiKey,
    hasKey,
  };
};

