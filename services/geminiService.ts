
import {GoogleGenAI, Type} from "@google/genai";
import { Student, ViolationRecord } from "../types";

// Always use process.env.GEMINI_API_KEY directly in the constructor
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateAIChatResponse = async (
  message: string,
  history: { role: 'user' | 'model', text: string }[],
  context: { students: Student[], violations: ViolationRecord[] }
) => {
  // Using gemini-3.1-pro-preview for complex reasoning tasks
  const model = 'gemini-3.1-pro-preview';
  
  const systemInstruction = `
    Bạn là trợ lý AI chuyên gia quản lý nề nếp tại THPT số 3 Tuy Phước. 
    Bộ quy tắc thi đua hiện tại (Năm 2025-2026):
    - Điểm gốc mỗi tuần: 200 điểm.
    - Điểm trừ nặng nhất: Đánh nhau, hút thuốc, vi phạm GT, trốn tiết (-20đ đến -50đ).
    - Điểm cộng: Việc tốt, viết bài tập san (+20đ đến +30đ).
    - Xếp loại: Tốt (>=200), Khá (180-200), Đạt (150-180), Chưa đạt (<150).

    Nhiệm vụ:
    1. Trả lời các câu hỏi về quy tắc trừ điểm (vd: "Không đồng phục bị trừ bao nhiêu điểm?").
    2. Phân tích dữ liệu học sinh/lớp (vd: "Học sinh nào vi phạm nhiều nhất?").
    3. Đề xuất giải pháp giáo dục tích cực cho các lỗi cụ thể.
    
    Ngôn ngữ: Tiếng Việt, chuyên nghiệp, hỗ trợ giáo viên và admin.
    Dữ liệu vi phạm gần đây: ${JSON.stringify(context.violations.slice(-15))}.
  `;

  // Fix: Construct the full contents array including history to maintain context
  const contents = [
    ...history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    })),
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ];

  try {
    // Fix: Use ai.models.generateContent to query GenAI with model, contents and systemInstruction
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // Fix: Access response.text as a property, not a method
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Tôi gặp sự cố kết nối. Vui lòng thử lại sau.";
  }
};

export interface AIAction {
  type: 'REMIND_CLASS' | 'REMIND_STUDENT' | 'PRAISE_CLASS' | 'PRAISE_STUDENT' | 'MEETING_REQUEST';
  target: string;
  reason: string;
  label: string;
}

export const generateActionableInsights = async (
  context: { students: Student[], violations: ViolationRecord[] }
) => {
  const model = 'gemini-3.1-pro-preview';
  
  const systemInstruction = `
    Bạn là chuyên gia phân tích dữ liệu nề nếp. 
    Dựa trên dữ liệu vi phạm gần đây, hãy đề xuất tối đa 4 hành động cụ thể để cải thiện nề nếp.
    Các loại hành động:
    - REMIND_CLASS: Nhắc nhở nề nếp lớp
    - REMIND_STUDENT: Nhắc nhở học sinh cá biệt
    - PRAISE_CLASS: Tuyên dương lớp xuất sắc
    - PRAISE_STUDENT: Tuyên dương gương người tốt
    - MEETING_REQUEST: Đề xuất họp với GVCN/Phụ huynh
  `;

  const prompt = `Phân tích dữ liệu sau và đưa ra các hành động cụ thể: 
    Học sinh: ${JSON.stringify(context.students.map(s => ({id: s.id, name: s.name, class: s.class, score: s.score})))}
    Vi phạm: ${JSON.stringify(context.violations.slice(-30))}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Tóm tắt ngắn gọn tình hình hiện tại" },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Loại hành động" },
                  target: { type: Type.STRING, description: "Đối tượng (tên lớp hoặc tên học sinh)" },
                  reason: { type: Type.STRING, description: "Lý do đề xuất" },
                  label: { type: Type.STRING, description: "Nhãn hiển thị trên nút bấm (vd: 'Nhắc nhở 10A1')" }
                },
                required: ["type", "target", "reason", "label"]
              }
            }
          },
          required: ["summary", "actions"]
        }
      },
    });

    return JSON.parse(response.text || '{"summary": "", "actions": []}');
  } catch (error) {
    console.error("Gemini Actionable Insights Error:", error);
    return { summary: "Không thể phân tích dữ liệu lúc này.", actions: [] };
  }
};
