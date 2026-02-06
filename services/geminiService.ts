// import { GoogleGenAI } from "@google/genai";

// AI Service tạm thời được vô hiệu hóa để tối ưu hóa hiệu suất tải trang
// và loại bỏ sự phụ thuộc vào thư viện @google/genai nặng.
// Để kích hoạt lại, hãy thêm @google/genai vào importmap trong index.html và bỏ comment code dưới đây.

export const summarizeDocument = async (
  fileBase64: string,
  mimeType: string
): Promise<string> => {
  console.log("AI Summary service called (Mock mode)");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Tính năng AI tóm tắt hiện đang tắt để tối ưu tốc độ tải trang. Vui lòng kiểm tra cấu hình để bật lại.");
    }, 1000);
  });
};

export const chatWithDocument = async (
  fileBase64: string,
  mimeType: string,
  question: string,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> => {
  console.log("AI Chat service called (Mock mode)");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Tính năng Chat AI hiện đang tắt để tối ưu tốc độ tải trang.");
    }, 1000);
  });
};