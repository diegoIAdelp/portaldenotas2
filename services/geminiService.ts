
import { GoogleGenAI, Type } from "@google/genai";

// Always initialize with apiKey in a named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeInvoiceImage = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      // Using the correct multi-part content structure as per SDK guidelines
      contents: {
        parts: [
          { text: "Extraia as seguintes informações desta nota fiscal: Nome do Fornecedor (Razão Social), Número da Nota, Data de Emissão (formato YYYY-MM-DD), Valor Total da Nota (numérico) e Número do Pedido/OS se disponível. Retorne apenas JSON." },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplierName: { type: Type.STRING },
            invoiceNumber: { type: Type.STRING },
            emissionDate: { type: Type.STRING },
            orderNumber: { type: Type.STRING },
            value: { type: Type.NUMBER },
          },
          required: ["supplierName", "invoiceNumber", "emissionDate", "value"]
        }
      }
    });

    // Directly accessing .text property (not a method call)
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro na análise da nota:", error);
    return null;
  }
};

export const generateAdminSummary = async (invoices: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise estes dados de notas fiscais, incluindo os valores financeiros, e forneça um resumo executivo curto em Português sobre o volume de gastos, principais fornecedores por valor e tendências financeiras: ${JSON.stringify(invoices)}`,
    });
    // Directly accessing .text property
    return response.text;
  } catch (error) {
    console.error("Erro no resumo:", error);
    return "Não foi possível gerar o resumo automático.";
  }
};
