import { GoogleGenerativeAI } from '@google/generative-ai';

// RAG sistemi için tip tanımları
export type DocumentChunk = {
  id: string;
  content: string;
  source: string;
  page?: number;
  embedding?: number[];
};

export type RAGContext = {
  documents: DocumentChunk[];
  summary: string;
  totalPages: number;
};

class RAGService {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: unknown; // GoogleGenerativeAI model type
  private textModel: unknown; // GoogleGenerativeAI model type

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API anahtarı bulunamadı!');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    this.textModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  // PDF'den metin çıkarma
  async extractTextFromPDF(pdfFile: File): Promise<DocumentChunk[]> {
    try {
      // PDF'i görsel sayfalarına çevir
      const images = await this.convertPdfToImages(pdfFile);
      const chunks: DocumentChunk[] = [];

      for (let i = 0; i < images.length; i++) {
        const imageData = images[i];
        const text = await this.extractTextFromImage(imageData);
        
        if (text.trim()) {
          chunks.push({
            id: `${pdfFile.name}-page-${i + 1}`,
            content: text,
            source: pdfFile.name,
            page: i + 1
          });
        }
      }

      return chunks;
    } catch (error) {
      console.error('PDF metin çıkarma hatası:', error);
      throw error;
    }
  }

  // Görselden metin çıkarma
  async extractTextFromImage(imageData: string): Promise<string> {
    try {
      const prompt = `Bu görseldeki tüm metni çıkar ve döndür. Matematiksel formüller, tablolar, grafikler ve diğer tüm içeriği dahil et. Sadece metni döndür, başka hiçbir şey ekleme.`;
      
      const result = await this.textModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageData.split(',')[1] // Base64'ten data kısmını al
          }
        }
      ]);

      return result.response.text();
    } catch (error) {
      console.error('Görsel metin çıkarma hatası:', error);
      return '';
    }
  }

  // PDF'i görsel sayfalarına çevirme
  private async convertPdfToImages(pdfFile: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // @ts-expect-error PDF.js global window object
          const pdfjsLib = window.pdfjsLib;
          if (!pdfjsLib) {
            throw new Error('PDF.js kütüphanesi yüklenemedi');
          }
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          const images: string[] = [];
          
          // Her sayfayı görsel olarak render et
          for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 50); pageNum++) { // Maksimum 50 sayfa
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
              canvasContext: context!,
              viewport: viewport
            };
            
            await page.render(renderContext).promise;
            images.push(canvas.toDataURL('image/png'));
          }
          
          resolve(images);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(pdfFile);
    });
  }

  // Embedding oluşturma
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Embedding oluşturma hatası:', error);
      throw error;
    }
  }

  // Dokümanları işleme ve embedding'leri oluşturma
  async processDocuments(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const processedChunks: DocumentChunk[] = [];

    for (const chunk of chunks) {
      try {
        // Metni temizle ve kısalt (embedding limiti için)
        const cleanedText = this.cleanText(chunk.content);
        if (cleanedText.length > 50) { // Minimum 50 karakter
          const embedding = await this.createEmbedding(cleanedText);
          processedChunks.push({
            ...chunk,
            content: cleanedText,
            embedding
          });
        }
      } catch (error) {
        console.error(`Chunk işleme hatası (${chunk.id}):`, error);
      }
    }

    return processedChunks;
  }

  // Metin temizleme
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
      .replace(/\n+/g, ' ') // Satır sonlarını boşluğa çevir
      .trim()
      .substring(0, 3000); // Maksimum 3000 karakter
  }

  // Benzerlik hesaplama (cosine similarity)
  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }

  // Sorgu için en alakalı dokümanları bulma
  async findRelevantDocuments(query: string, documents: DocumentChunk[], topK: number = 3): Promise<DocumentChunk[]> {
    try {
      const queryEmbedding = await this.createEmbedding(query);
      
      // Her doküman için benzerlik hesapla
      const scoredDocuments = documents.map(doc => ({
        ...doc,
        similarity: doc.embedding ? this.calculateSimilarity(queryEmbedding, doc.embedding) : 0
      }));

      // Benzerliğe göre sırala ve en iyi K tanesini al
      return scoredDocuments
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .filter(doc => doc.similarity > 0.3); // Minimum benzerlik eşiği
    } catch (error) {
      console.error('Alakalı doküman bulma hatası:', error);
      return [];
    }
  }

  // RAG context'i oluşturma
  async createRAGContext(files: Array<{ file: File; data: string; type: 'image' | 'pdf' }>): Promise<RAGContext> {
    const allChunks: DocumentChunk[] = [];
    let totalPages = 0;

    for (const fileData of files) {
      try {
        if (fileData.type === 'pdf') {
          // PDF'den metin çıkar (tüm sayfalar)
          const pdfChunks = await this.extractTextFromPDF(fileData.file);
          allChunks.push(...pdfChunks);
          totalPages += pdfChunks.length;
        } else {
          // Görselden metin çıkar
          const text = await this.extractTextFromImage(fileData.data);
          if (text.trim()) {
            allChunks.push({
              id: `${fileData.file.name}-image`,
              content: text,
              source: fileData.file.name
            });
            totalPages += 1;
          }
        }
      } catch (error) {
        console.error(`${fileData.file.name} işleme hatası:`, error);
      }
    }

    // Dokümanları işle ve embedding'leri oluştur
    const processedChunks = await this.processDocuments(allChunks);

    // Özet oluştur
    const summary = await this.createSummary(processedChunks);

    return {
      documents: processedChunks,
      summary,
      totalPages
    };
  }

  // Dokümanlardan özet oluşturma
  private async createSummary(chunks: DocumentChunk[]): Promise<string> {
    try {
      const allText = chunks.map(chunk => chunk.content).join('\n\n');
      const prompt = `Aşağıdaki ders materyallerinin kısa bir özetini çıkar (maksimum 300 kelime):

${allText.substring(0, 5000)} // İlk 5000 karakter

Özet:`;

      const result = await this.textModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Özet oluşturma hatası:', error);
      return 'Materyal işlendi ancak özet oluşturulamadı.';
    }
  }

  // LLM prompt'unu RAG context'i ile zenginleştirme
  async enhancePromptWithRAG(originalPrompt: string, ragContext: RAGContext, userQuery?: string): Promise<string> {
    try {
      let relevantDocs: DocumentChunk[] = [];
      
      if (userQuery) {
        // Kullanıcı sorgusu varsa alakalı dokümanları bul
        relevantDocs = await this.findRelevantDocuments(userQuery, ragContext.documents);
      } else {
        // Yoksa tüm dokümanları kullan
        relevantDocs = ragContext.documents.slice(0, 10); // İlk 10 doküman
      }

      const contextText = relevantDocs.map(doc => 
        `[${doc.source}${doc.page ? ` - Sayfa ${doc.page}` : ''}]: ${doc.content}`
      ).join('\n\n');

      const enhancedPrompt = `${originalPrompt}

DERS MATERYALİ ÖZETİ:
${ragContext.summary}

DETAYLI MATERYAL BİLGİLERİ:
${contextText}

Toplam ${ragContext.totalPages} sayfa/görsel işlendi.

Şimdi yukarıdaki materyal bilgilerini kullanarak yanıt ver.`;

      return enhancedPrompt;
    } catch (error) {
      console.error('Prompt zenginleştirme hatası:', error);
      return originalPrompt;
    }
  }
}

export const ragService = new RAGService(); 