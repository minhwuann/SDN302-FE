import { useState, useRef, useEffect, useCallback } from "react";
import * as aiApi from "../../services/aiApi";
import { useAuth } from "../../contexts/AuthContext";
import { useTransactionsContext } from "../../contexts/TransactionsContext";

// Constants cho rate limiting
const MIN_REQUEST_INTERVAL = 2000; // 2 giây giữa các request
const MAX_REQUESTS_PER_MINUTE = 10; // Tối đa 10 requests/phút

/** Tin nhắn có số tiền cụ thể -> thử /ai/transaction-preview trước khi hỏi /ai/chat. */
const MONEY_PATTERN =
  /\d+(?:[.,]\d+)?\s*(?:tri[eệ]u|trieu|tr|ngh[iì]n|nghin|ng[aà]n|ngan|k)?/iu;

function looksLikeTransaction(text) {
  return MONEY_PATTERN.test(text || "");
}

function getTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/**
 * Hook xử lý logic cho AIChatBox - gọi thẳng /api/v1/ai/* của BE
 * (BE tự giữ Gemini key, tự suy luận + validate, tự lưu lịch sử hội thoại).
 * Có rate limiting phía client để tránh spam.
 *
 * @returns {Object} Object chứa state và handlers
 */
export const useAIChat = () => {
  const { currentUser } = useAuth();
  const { currentLedger, paymentAccounts, refreshData } =
    useTransactionsContext();

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [previewTransactions, setPreviewTransactions] = useState([]);
  const messagesEndRef = useRef(null);

  // Rate limiting refs
  const lastRequestTimeRef = useRef(0);
  const requestCountRef = useRef([]);

  /** Tải hội thoại AI gần nhất từ BE (thay cho cache localStorage trước đây). */
  useEffect(() => {
    if (!currentUser) {
      setIsHistoryLoading(false);
      return undefined;
    }
    let active = true;
    (async () => {
      try {
        const conversations = await aiApi.listConversations();
        const latest = conversations[0];
        if (!latest || !active) return;

        const history = await aiApi.listConversationMessages(latest.id);
        if (!active) return;

        setConversationId(latest.id);
        setMessages(
          history
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content || "",
              timestamp: m.createdAt,
            }))
        );
      } catch (err) {
        console.error("Lỗi khi tải lịch sử chat:", err);
      } finally {
        if (active) setIsHistoryLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser]);

  /** Scroll xuống cuối chat khi có tin nhắn mới */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role, content, image = null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role,
        content,
        image,
        timestamp: new Date(),
      },
    ]);
  };

  const checkRateLimit = useCallback(() => {
    const now = Date.now();

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

  /** Đưa 1 preview giao dịch (từ transaction-preview hoặc receipt-scan) vào state chờ xác nhận. */
  const showTransactionPreview = (previews, fallbackMessage) => {
    setPreviewTransactions(previews);
    const first = previews[0];
    const summary =
      previews.length > 1
        ? `Đã chuẩn bị ${previews.length} giao dịch.\n\nVui lòng xác nhận bên dưới để lưu tất cả vào hệ thống.`
        : `Đã chuẩn bị giao dịch ${
            first.type === "income" ? "thu nhập" : "chi tiêu"
          } ${first.amountVnd?.toLocaleString(
            "vi-VN"
          )} VND.\n\nVui lòng xác nhận bên dưới để lưu vào hệ thống.`;

    addMessage("assistant", fallbackMessage || summary);
  };

  /**
   * Xử lý khi người dùng gửi tin nhắn.
   * - Có ảnh đính kèm -> /ai/receipt-scan (quét hoá đơn/chuyển khoản).
   * - Có số tiền cụ thể -> /ai/transaction-preview (chuẩn bị giao dịch để xác nhận).
   * - Còn lại -> /ai/chat (hỏi đáp, BE tự gọi tool nội bộ khi cần).
   *
   * @param {string} userMessage - Tin nhắn từ người dùng
   * @param {{file: File, dataUrl: string}|null} attachedImage - Ảnh đính kèm (nếu có)
   */
  const handleSendMessage = async (userMessage, attachedImage = null) => {
    if ((!userMessage?.trim() && !attachedImage) || !currentUser || !currentLedger)
      return;
    if (isLoading) return;

    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      addMessage("assistant", `⏳ ${rateLimitCheck.message}`);
      return;
    }

    const now = Date.now();
    lastRequestTimeRef.current = now;
    requestCountRef.current.push(now);

    addMessage(
      "user",
      userMessage || "Đã đính kèm một hình ảnh",
      attachedImage?.dataUrl
    );
    setIsLoading(true);

    try {
      if (attachedImage) {
        const mimeType =
          attachedImage.dataUrl.split(";")[0].split(":")[1] || "image/jpeg";
        const imageBase64 = attachedImage.dataUrl.split(",")[1];

        const result = await aiApi.scanReceipt({
          ledgerId: currentLedger.id,
          imageBase64,
          mimeType,
          timeZone: getTimeZone(),
        });

        if (result.missingFields.length > 0) {
          addMessage(
            "assistant",
            result.clarification ||
              "Mình chưa đọc rõ hết thông tin trên ảnh, bạn kiểm tra lại giúp mình nhé."
          );
        } else {
          showTransactionPreview([result.transactionPreview]);
        }
      } else if (looksLikeTransaction(userMessage)) {
        const result = await aiApi.getTransactionPreview({
          text: userMessage,
          timeZone: getTimeZone(),
        });

        if (result.missingFields.length > 0) {
          addMessage(
            "assistant",
            result.clarification ||
              "Mình cần thêm thông tin để ghi giao dịch này, bạn nói rõ hơn nhé."
          );
        } else {
          showTransactionPreview(result.previews);
        }
      } else {
        const result = await aiApi.chat({
          message: userMessage,
          ledgerId: currentLedger.id,
          conversationId: conversationId || undefined,
          timeZone: getTimeZone(),
        });

        if (result.conversation?.id) setConversationId(result.conversation.id);
        addMessage("assistant", result.message || "Đã xử lý xong.");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý tin nhắn:", error);
      addMessage(
        "assistant",
        error.message ||
          "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** Xác nhận và lưu các giao dịch đang preview (gọi /ai/execute-action cho từng cái). */
  const handleConfirmAdd = async () => {
    if (previewTransactions.length === 0) return;

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const preview of previewTransactions) {
      try {
        await aiApi.executeAction("createTransaction", {
          ledgerId: currentLedger.id,
          type: preview.type,
          amountVnd: preview.amountVnd,
          categoryId: preview.categoryId,
          subcategoryId: preview.subcategoryId || undefined,
          transactionDate: preview.transactionDate,
          note: preview.note || undefined,
          paymentMethod: preview.paymentMethod,
          paymentAccountId: preview.paymentAccountId || undefined,
        });
        successCount += 1;
      } catch (error) {
        console.error("Lỗi khi lưu giao dịch:", error);
        errorCount += 1;
      }
    }

    setPreviewTransactions([]);
    if (successCount > 0) await refreshData();

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
    setIsLoading(false);
  };

  /** Hủy preview giao dịch */
  const handleCancelPreview = () => {
    setPreviewTransactions([]);
  };

  /** Xóa hội thoại hiện tại trên UI (không xoá lịch sử đã lưu ở BE) */
  const handleClearChat = () => {
    setMessages([]);
    setPreviewTransactions([]);
    setConversationId(null);
  };

  return {
    messages,
    isLoading,
    isHistoryLoading,
    previewTransactions,
    paymentAccounts,
    messagesEndRef,
    handleSendMessage,
    handleConfirmAdd,
    handleCancelPreview,
    handleClearChat,
  };
};
