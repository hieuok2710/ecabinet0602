import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const summarizeDocument = async (
  fileBase64: string,
  mimeType: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    // Using gemini-3-flash-preview for fast text tasks as recommended
    const modelId = "gemini-3-flash-preview";
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64,
            },
          },
          {
            text: "Hãy tạo một bản tóm tắt chi tiết bằng tiếng Việt cho tài liệu này. Tập trung vào các điểm chính, quyết định quan trọng hoặc số liệu đáng chú ý. Định dạng câu trả lời rõ ràng với các gạch đầu dòng.",
          },
        ],
      },
    });

    return response.text || "Không thể tạo tóm tắt.";
  } catch (error) {
    console.error("Error summarizing document:", error);
    throw new Error("Có lỗi xảy ra khi tóm tắt tài liệu.");
  }
};

export const chatWithDocument = async (
  fileBase64: string,
  mimeType: string,
  question: string,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> => {
  try {
    const ai = getAiClient();
    const modelId = "gemini-3-flash-preview";

    const chat = ai.chats.create({
        model: modelId,
        history: [
            {
                role: 'user',
                parts: [{
                    inlineData: {
                        mimeType: mimeType,
                        data: fileBase64
                    }
                }, {
                    text: "Đây là tài liệu ngữ cảnh cho cuộc hội thoại này."
                }]
            },
            {
                role: 'model',
                parts: [{ text: "Đã hiểu. Tôi đã đọc tài liệu và sẵn sàng trả lời câu hỏi của bạn."}]
            },
            ...history
        ]
    })

    const result = await chat.sendMessage({ message: question });
    return result.text || "Không có phản hồi.";
  } catch (error) {
    console.error("Error chatting with document:", error);
    throw new Error("Có lỗi xảy ra khi trả lời câu hỏi.");
  }
};
