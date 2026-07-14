import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Divider,
} from "@heroui/react";
import {
  Send,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  MessageSquare,
  PlusCircle,
  BarChart3,
  FileText,
  Clock,
  Lightbulb,
  Mic,
  ImageIcon,
} from "lucide-react";
import { useAIChat } from "./useAIChat";
import { useDisclosure } from "@heroui/react";
import { formatCurrency } from "../../utils/formatCurrency";

/**
 * Component Chat Box cho AI Assistant
 * Giao diện chat hiện đại với bong bóng tin nhắn
 */
const AIChatBox = ({ isOpen, onOpenChange }) => {
  const {
    messages,
    isLoading,
    previewTransactions,
    paymentAccounts,
    messagesEndRef,
    handleSendMessage,
    handleConfirmAdd,
    handleCancelPreview,
    handleClearChat,
  } = useAIChat();

  // const { isOpen, onOpen, onOpenChange } = useDisclosure(); // Moved to Layout
  const {
    isOpen: isHelpOpen,
    onOpen: onOpenHelp,
    onOpenChange: onHelpChange,
  } = useDisclosure();
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "vi-VN";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? prev + " " + transcript : transcript));
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome.");
      }
    }
  };

  const [attachedImage, setAttachedImage] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage({
          file: file,
          dataUrl: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  /**
   * Quick actions - gửi nhanh các câu lệnh phổ biến
   */
  const quickActions = [
    {
      label: "Thêm chi tiêu",
      icon: PlusCircle,
      prompt: "Thêm chi tiêu 50000 cho ăn uống hôm nay",
    },
    {
      label: "Thống kê tháng",
      icon: BarChart3,
      prompt: "Thống kê chi tiêu tháng này",
    },
    {
      label: "Tổng đã chi",
      icon: FileText,
      prompt: "Tôi đã chi bao nhiêu tháng này?",
    },
  ];

  const handleQuickAction = (prompt) => {
    if (!isLoading) {
      handleSendMessage(prompt);
    }
  };

  /**
   * Xử lý khi người dùng gửi tin nhắn
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if ((inputMessage.trim() || attachedImage) && !isLoading) {
      handleSendMessage(inputMessage, attachedImage);
      setInputMessage("");
      setAttachedImage(null);
    }
  };

  return (
    <>
      {/* Floating Action Button removed - Controlled by external SpeedDial */}

      {/* Modal Chat Box */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        placement="center"
        scrollBehavior="inside"
        hideCloseButton
        classNames={{
          base: "mx-2 sm:mx-4 max-h-[85vh] sm:max-h-[80vh]",
          body: "p-0",
          backdrop: "bg-black/50",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              {/* Header với gradient */}
              <ModalHeader className="flex items-center justify-between bg-gradient-to-r from-primary-500 via-primary-600 to-blue-600 text-white p-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Trợ lý Tài chính AI</h2>
                    <p className="text-xs text-white/80 font-normal">
                      Hỏi bất cứ điều gì về tài chính
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={handleClearChat}
                      aria-label="Xóa lịch sử chat"
                      className="text-white/80 hover:text-white hover:bg-white/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={onClose}
                    aria-label="Đóng"
                    className="text-white/80 hover:text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </ModalHeader>
              <ModalBody className="p-0">
                {/* Chat Messages */}
                <div className="flex flex-col h-[60vh] sm:h-[55vh] bg-gray-50 dark:bg-gray-900">
                  {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-950/30">
                      {/* AI Avatar với animation */}
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-full shadow-lg">
                          <Sparkles className="w-10 h-10 text-white" />
                        </div>
                      </div>

                      {/* Welcome Message */}
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Chào bạn! 👋
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                        Tôi là Trợ lý Tài chính AI của bạn. Hãy hỏi tôi bất cứ
                        điều gì về tài chính của bạn!
                      </p>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2 justify-center mb-6">
                        {quickActions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant="flat"
                            color="primary"
                            startContent={<action.icon className="w-4 h-4" />}
                            onPress={() => handleQuickAction(action.prompt)}
                            className="text-xs"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>

                      {/* Help Guide Button */}
                      <Button
                        variant="light"
                        size="sm"
                        startContent={<HelpCircle className="w-4 h-4" />}
                        onPress={onOpenHelp}
                        className="text-gray-500 dark:text-gray-400"
                      >
                        Xem hướng dẫn sử dụng AI
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              message.role === "user"
                                ? "bg-primary-600 text-white"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap">
                              {message.image && (
                                <img
                                  src={message.image}
                                  alt="attached"
                                  className="max-w-[200px] max-h-[200px] rounded-lg mb-2 object-contain bg-white/10"
                                />
                              )}
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 border border-gray-200 dark:border-gray-700">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                              <span
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></span>
                              <span
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.4s" }}
                              ></span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}

                  {/* Preview Transaction Card(s) */}
                  {previewTransactions.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-gray-800">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        {previewTransactions.length > 1
                          ? `Xem trước ${previewTransactions.length} giao dịch`
                          : "Xem trước giao dịch"}
                      </h4>

                      <div
                        className={`space-y-3 ${
                          previewTransactions.length > 1
                            ? "max-h-[300px] sm:max-h-[400px] lg:max-h-[450px] overflow-y-auto pr-2"
                            : ""
                        }`}
                      >
                        {previewTransactions.map((transaction, index) => {
                          const paymentAccountName = paymentAccounts?.find(
                            (a) => a.id === transaction.paymentAccountId
                          )?.name;

                          return (
                            <Card
                              key={index}
                              className="border border-primary-200 dark:border-primary-800"
                            >
                              <CardBody className="p-3 sm:p-4">
                                <div className="space-y-1.5 text-xs sm:text-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                                      {previewTransactions.length > 1
                                        ? `Giao dịch ${index + 1}:`
                                        : "Loại:"}
                                    </span>
                                    <Chip
                                      size="sm"
                                      color={
                                        transaction.type === "income"
                                          ? "success"
                                          : "danger"
                                      }
                                      variant="flat"
                                    >
                                      {transaction.type === "income"
                                        ? "Thu"
                                        : "Chi"}
                                    </Chip>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Số tiền:
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {formatCurrency(transaction.amountVnd)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Danh mục:
                                    </span>
                                    <span className="text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                                      {transaction.categoryName || "Khác"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Ngày:
                                    </span>
                                    <span className="text-gray-900 dark:text-white">
                                      {transaction.transactionDate}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Phương thức:
                                    </span>
                                    <span className="text-gray-900 dark:text-white">
                                      {transaction.paymentMethod === "transfer"
                                        ? "Chuyển khoản"
                                        : "Tiền mặt"}
                                    </span>
                                  </div>
                                  {paymentAccountName && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        Ngân hàng/Ví:
                                      </span>
                                      <span className="text-gray-900 dark:text-white font-medium truncate max-w-[120px] sm:max-w-none">
                                        {paymentAccountName}
                                      </span>
                                    </div>
                                  )}
                                  {transaction.note && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        Ghi chú:
                                      </span>
                                      <span className="text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                                        {transaction.note}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardBody>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          color="success"
                          size="sm"
                          startContent={<CheckCircle2 className="w-4 h-4" />}
                          onPress={handleConfirmAdd}
                          isLoading={isLoading}
                          className="flex-1"
                        >
                          {previewTransactions.length > 0
                            ? `Lưu tất cả (${previewTransactions.length})`
                            : "Lưu"}
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          startContent={<XCircle className="w-4 h-4" />}
                          onPress={handleCancelPreview}
                          className="flex-1"
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-gray-800">
                      {attachedImage && (
                        <div className="relative mb-2 inline-block">
                          <img
                            src={attachedImage.dataUrl}
                            alt="preview"
                            className="h-16 rounded-md object-cover border border-gray-200"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                            onClick={() => setAttachedImage(null)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <form
                        onSubmit={handleSubmit}
                        className="flex gap-2 items-end"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                        />
                        <Button
                          type="button"
                          color="default"
                          isIconOnly
                          variant="flat"
                          onPress={() => fileInputRef.current?.click()}
                          isDisabled={isLoading}
                          aria-label="Tải ảnh lên"
                          className="flex-shrink-0"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                        <Textarea
                          value={inputMessage}
                          onValueChange={setInputMessage}
                          placeholder="Nhập câu hỏi hoặc yêu cầu của bạn... (Có thể nhập nhiều dòng)"
                          variant="bordered"
                          isDisabled={isLoading}
                          minRows={1}
                          maxRows={4}
                          classNames={{
                            input: "text-sm",
                            base: "flex-1",
                          }}
                          onKeyDown={(e) => {
                            // Enter để gửi, Shift+Enter để xuống dòng
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          color={isListening ? "danger" : "default"}
                          isIconOnly
                          variant={isListening ? "solid" : "flat"}
                          onPress={toggleListening}
                          isDisabled={isLoading}
                          aria-label="Nhập bằng giọng nói"
                          className="flex-shrink-0"
                        >
                          <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
                        </Button>
                        <Button
                          type="submit"
                          color="primary"
                          isIconOnly
                          isDisabled={(!inputMessage.trim() && !attachedImage) || isLoading}
                          isLoading={isLoading}
                          aria-label="Gửi tin nhắn"
                          className="flex-shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Help Guide Modal */}
      <Modal
        isOpen={isHelpOpen}
        onOpenChange={onHelpChange}
        size="lg"
        placement="center"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span>Hướng dẫn sử dụng Trợ lý AI</span>
              </ModalHeader>
              <ModalBody className="py-4">
                <div className="space-y-4">
                  {/* Intro */}
                  <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-950/30 dark:to-blue-950/30 p-4 rounded-xl">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Trợ lý AI có thể giúp bạn quản lý tài chính bằng ngôn ngữ
                      tự nhiên. Dưới đây là những gì AI có thể làm:
                    </p>
                  </div>

                  {/* Capabilities */}
                  <div className="space-y-3">
                    {/* Add Transaction */}
                    <div className="flex gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                      <div className="bg-emerald-500 p-2 rounded-lg">
                        <PlusCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          Thêm giao dịch
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          "Thêm chi tiêu 50.000 cho ăn uống hôm nay"
                          <br />
                          "Hôm qua tôi nhận lương 15 triệu"
                          <br />
                          "Chi 200k cho xăng xe bằng chuyển khoản"
                        </p>
                      </div>
                    </div>

                    {/* Multiple Transactions */}
                    <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          Nhập nhiều giao dịch cùng lúc
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          "Hôm nay tôi chi 50k ăn sáng, 100k đổ xăng, 200k mua
                          đồ"
                          <br />
                          AI sẽ tự động tách thành nhiều giao dịch riêng biệt
                        </p>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="flex gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="bg-purple-500 p-2 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          Thống kê & Phân tích
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          "Tôi đã chi bao nhiêu tháng này?"
                          <br />
                          "Thống kê chi tiêu theo danh mục"
                          <br />
                          "So sánh thu chi tuần này với tuần trước"
                        </p>
                      </div>
                    </div>

                    {/* Time Expressions */}
                    <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                      <div className="bg-amber-500 p-2 rounded-lg">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          Hiểu thời gian tương đối
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          AI hiểu: "hôm nay", "hôm qua", "tuần trước", "tháng
                          này", "ngày 15", "thứ 2 vừa rồi"...
                        </p>
                      </div>
                    </div>

                    {/* Q&A */}
                    <div className="flex gap-3 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg">
                      <div className="bg-rose-500 p-2 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          Hỏi đáp tự do
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          "Tôi có đang chi tiêu vượt mức không?"
                          <br />
                          "Danh mục nào tốn nhiều tiền nhất?"
                          <br />
                          "Gợi ý cách tiết kiệm?"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <Divider />
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      💡 Mẹo sử dụng:
                    </p>
                    <p>• Nói càng chi tiết, AI hiểu càng chính xác</p>
                    <p>• AI sẽ luôn xác nhận trước khi lưu giao dịch</p>
                    <p>• Có thể nhập nhiều dòng bằng Shift+Enter</p>
                  </div>

                  {/* API Quota Explanation */}
                  <Divider />
                  <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-500 dark:bg-gray-600 p-2 rounded-lg flex-shrink-0">
                        <HelpCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                          ⚡ Giới hạn sử dụng API (Quota)
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          AI này sử dụng <strong>Google Gemini API</strong> (gói
                          miễn phí). Bạn có <strong>giới hạn số lần hỏi</strong>{" "}
                          mỗi ngày:
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-600">
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                              10
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              lần/phút
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-600">
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                              ~1500
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              lần/ngày
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
                          <strong>Mẹo tiết kiệm:</strong>
                        </p>
                        <ul className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
                          <li>
                            Gộp nhiều giao dịch vào 1 tin nhắn thay vì gửi riêng
                            lẻ
                          </li>
                          <li>Chờ AI trả lời xong mới gửi câu tiếp theo</li>
                          <li>Tránh spam gửi liên tục</li>
                        </ul>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic">
                          Nếu vượt giới hạn, bạn cần đợi 1 phút hoặc đến ngày
                          hôm sau.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Đã hiểu
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default AIChatBox;
