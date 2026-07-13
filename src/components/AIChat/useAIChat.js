import { useState, useRef, useEffect, useCallback } from "react";
import { processUserMessage } from "../../services/gemini";
import { useGeminiKey } from "../../hooks/useGeminiKey";
import { useAuth } from "../../contexts/AuthContext";
import { useTransactionsContext } from "../../contexts/TransactionsContext";
import * as functionHandlers from "../../services/geminiFunctionHandlers";
import { useBudgetContext } from "../../contexts/BudgetContext";
import { useGoals } from "../../hooks/useGoals";

const STORAGE_KEY = "AIChatMessages";

// Constants cho rate limiting
const MIN_REQUEST_INTERVAL = 2000; // 2 giây giữa các request
const MAX_REQUESTS_PER_MINUTE = 10; // Tối đa 10 requests/phút

/**
 * Hook xử lý logic cho AIChatBox
 * Quản lý chat history, xử lý tin nhắn, và tương tác với AI
 * Có rate limiting để tránh spam API
 *
 * @returns {Object} Object chứa state và handlers
 */
export const useAIChat = () => {
  const { apiKey, hasKey } = useGeminiKey();
  const { currentUser } = useAuth();
  const { addTransaction, deleteTransaction, transactions, currentLedger } =
    useTransactionsContext();

  const { budgets } = useBudgetContext();
  const { goals } = useGoals();

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Lưu tin nhắn vào localStorage mỗi khi thay đổi
  useEffect(() => {
    // Lọc bỏ dataUrl khổng lồ của hình ảnh để tránh lỗi QuotaExceededError
    const messagesToSave = messages.map((msg) => {
      if (msg.image) {
        const { image, ...rest } = msg;
        return rest;
      }
      return msg;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave));
    } catch (e) {
      console.warn("Lỗi khi lưu chat history vào localStorage:", e);
    }
  }, [messages]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewTransaction, setPreviewTransaction] = useState(null);
  const [previewTransactions, setPreviewTransactions] = useState([]); // Hỗ trợ nhiều transactions
  const messagesEndRef = useRef(null);

  // Rate limiting refs
  const lastRequestTimeRef = useRef(0);
  const requestCountRef = useRef([]);

  /**
   * Scroll xuống cuối chat khi có tin nhắn mới
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Thêm tin nhắn vào chat history
   *
   * @param {string} role - 'user' hoặc 'assistant'
   * @param {string} content - Nội dung tin nhắn
   */
  const addMessage = (role, content, image = null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role,
        content,
        image,
        timestamp: new Date(),
      },
    ]);
  };

  /**
   * Kiểm tra rate limit
   * @returns {Object} { allowed: boolean, waitTime: number, message: string }
   */

  const checkRateLimit = useCallback(() => {
    const now = Date.now();

    // Kiểm tra khoảng cách giữa 2 request
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil(
        (MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000
      );
      return {
        allowed: false,
        waitTime,
        message: `Vui lòng đợi ${waitTime} giây trước khi gửi tin nhắn tiếp.`,
      };
    }

    // Kiểm tra số request trong 1 phút
    const oneMinuteAgo = now - 60000;
    requestCountRef.current = requestCountRef.current.filter(
      (time) => time > oneMinuteAgo
    );

    if (requestCountRef.current.length >= MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = requestCountRef.current[0];
      const waitTime = Math.ceil((oldestRequest + 60000 - now) / 1000);
      return {
        allowed: false,
        waitTime,
        message: `Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi ${waitTime} giây.`,
      };
    }

    return { allowed: true, waitTime: 0, message: "" };
  }, []);

  /**
   * Xử lý khi người dùng gửi tin nhắn
   * Sử dụng Function Calling để AI có thể gọi trực tiếp các hàm trong hệ thống
   *
   * @param {string} userMessage - Tin nhắn từ người dùng
   */
  const handleSendMessage = async (userMessage, attachedImage = null) => {
    if ((!userMessage?.trim() && !attachedImage) || !hasKey || !currentUser) return;
    if (isLoading) return; // Chặn gửi khi đang loading

    // Kiểm tra rate limit
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      addMessage("assistant", `⏳ ${rateLimitCheck.message}`);
      return;
    }

    // Cập nhật rate limit tracking
    const now = Date.now();
    lastRequestTimeRef.current = now;
    requestCountRef.current.push(now);

    // Thêm tin nhắn người dùng vào chat
    addMessage("user", userMessage || "Đã đính kèm một hình ảnh", attachedImage?.dataUrl);
    setIsLoading(true);

    try {
      // Chuẩn bị context cho function handlers
      const context = {
        userId: currentUser.uid,
        ledgerId: currentLedger?.id || "main",
        transactions: transactions || [],
        budgets: budgets || [],
        goals: goals || [],
        addTransaction: addTransaction,
        deleteTransaction: deleteTransaction,
      };

      // Giới hạn chat history để giảm token (chỉ giữ 4 messages gần nhất)
      const MAX_HISTORY = 4;
      const limitedHistory =
        messages.length > MAX_HISTORY ? messages.slice(-MAX_HISTORY) : messages;

      // Tạo sẵn tin nhắn rỗng của AI để stream chữ
      const assistantMessageId = Date.now().toString() + "-ai";
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      const onStream = (textChunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + textChunk }
              : msg
          )
        );
      };

      // Gọi processUserMessage với Function Calling và Streaming
      const aiResponse = await processUserMessage(
        userMessage,
        apiKey,
        limitedHistory,
        functionHandlers,
        context,
        onStream,
        attachedImage
      );

      // Xử lý function calls nếu có
      if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
        // Lấy tất cả các addTransaction calls
        const addTransactionCalls = aiResponse.functionCalls.filter(
          (fc) => fc.name === "addTransaction" && fc.result && fc.result.success
        );

        if (addTransactionCalls.length > 0) {
          // Xử lý nhiều transactions cùng lúc
          const transactions = addTransactionCalls
            .map((fc) => fc.result.transaction)
            .filter((tx) => tx); // Lọc bỏ null/undefined

          if (transactions.length === 1) {
            // Chỉ 1 transaction - dùng previewTransaction như cũ
            setPreviewTransaction(transactions[0]);
            setPreviewTransactions([]);
            const previewMessage =
              aiResponse.text ||
              `Đã chuẩn bị giao dịch ${
                transactions[0].type === "income" ? "thu nhập" : "chi tiêu"
              } ${transactions[0].amount?.toLocaleString(
                "vi-VN"
              )} VND.\n\nVui lòng xác nhận bên dưới để lưu vào hệ thống.`;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: previewMessage }
                  : msg
              )
            );
          } else if (transactions.length > 1) {
            // Nhiều transactions - dùng previewTransactions
            setPreviewTransaction(null);
            setPreviewTransactions(transactions);
            const previewMessage =
              aiResponse.text ||
              `Đã chuẩn bị ${transactions.length} giao dịch.\n\nVui lòng xác nhận bên dưới để lưu tất cả vào hệ thống.`;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: previewMessage }
                  : msg
              )
            );
          }
        } else {
          // Các hàm khác (query, getTotal, etc.) - Text đã được stream, nếu rỗng thì set backup
          if (!aiResponse.text) {
             setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: "Đã xử lý xong." }
                    : msg
                )
             );
          }
        }
      } else {
        // Text đã được stream, không cần làm gì thêm
      }
    } catch (error) {
      console.error("Lỗi khi xử lý tin nhắn:", error);

      // Xử lý các loại lỗi khác nhau
      let errorMessage =
        "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại. Chi tiết: " + (error?.message || String(error));

      if (
        error.message?.includes("503") ||
        error.message?.includes("UNAVAILABLE") ||
        error.message?.includes("high demand")
      ) {
        errorMessage =
          "⚠️ Model AI hiện đang quá tải (503). Vui lòng thử lại sau vài giây.";
      } else if (
        error.message?.includes("429") ||
        error.message?.includes("quota") ||
        error.message?.includes("rate-limit")
      ) {
        errorMessage =
          "⚠️ Bạn đã vượt quá hạn mức sử dụng API (quota) của Gemini.\n\n" +
          "Vui lòng:\n" +
          "1. Kiểm tra quota tại: https://ai.dev/usage?tab=rate-limit\n" +
          "2. Đợi một chút rồi thử lại\n" +
          "3. Hoặc nâng cấp gói API của bạn\n\n" +
          "Thông tin chi tiết: https://ai.google.dev/gemini-api/docs/rate-limits";
      } else if (error.message?.includes("API Key")) {
        errorMessage =
          "❌ API Key không hợp lệ hoặc chưa được cấu hình.\n\n" +
          "Vui lòng kiểm tra lại API Key trong cài đặt.";
      } else if (
        error.message?.includes("404") ||
        error.message?.includes("not found")
      ) {
        errorMessage =
          "❌ Model AI không tìm thấy.\n\n" +
          "Có thể model đã thay đổi hoặc không khả dụng. Vui lòng thử lại sau.";
      }

      addMessage("assistant", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Xác nhận và lưu transaction từ preview
   */
  const handleConfirmAdd = async () => {
    // Xử lý nhiều transactions nếu có
    if (previewTransactions.length > 0) {
      try {
        setIsLoading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const transaction of previewTransactions) {
          try {
            await addTransaction(transaction);
            successCount++;
          } catch (error) {
            console.error("Lỗi khi lưu giao dịch:", error);
            errorCount++;
          }
        }

        setPreviewTransactions([]);

        if (errorCount === 0) {
          addMessage(
            "assistant",
            `✅ Đã lưu thành công ${successCount} giao dịch vào hệ thống!`
          );
        } else {
          addMessage(
            "assistant",
            `⚠️ Đã lưu ${successCount} giao dịch, ${errorCount} giao dịch gặp lỗi.`
          );
        }
      } catch (error) {
        console.error("Lỗi khi lưu giao dịch:", error);
        addMessage(
          "assistant",
          "❌ Có lỗi xảy ra khi lưu giao dịch. Vui lòng thử lại."
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Xử lý 1 transaction như cũ
    if (!previewTransaction) return;

    try {
      setIsLoading(true);
      await addTransaction(previewTransaction);
      setPreviewTransaction(null);
      addMessage("assistant", "✅ Đã lưu giao dịch thành công vào hệ thống!");
    } catch (error) {
      console.error("Lỗi khi lưu giao dịch:", error);
      addMessage(
        "assistant",
        "❌ Có lỗi xảy ra khi lưu giao dịch. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Hủy preview transaction
   */
  const handleCancelPreview = () => {
    setPreviewTransaction(null);
    setPreviewTransactions([]);
  };

  /**
   * Xóa toàn bộ lịch sử chat
   */
  const handleClearChat = () => {
    setMessages([]);
    setPreviewTransaction(null);
    setPreviewTransactions([]);
  };

  return {
    messages,
    isLoading,
    previewTransaction,
    previewTransactions,
    hasKey,
    messagesEndRef,
    handleSendMessage,
    handleConfirmAdd,
    handleCancelPreview,
    handleClearChat,
  };
};
