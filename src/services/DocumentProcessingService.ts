import { terminalLogger } from '../utils/terminalLogger';

export interface ProcessedDocument {
  id: string;
  filename: string;
  content: string;
  pages: DocumentPage[];
  metadata: DocumentMetadata;
  extractedText: string;
  structure: DocumentStructure;
}

export interface DocumentPage {
  pageNumber: number;
  content: string;
  dimensions: {
    width: number;
    height: number;
  };
  textBlocks: TextBlock[];
}

export interface TextBlock {
  id: string;
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

export interface DocumentMetadata {
  filename: string;
  size: number;
  type: string;
  lastModified: Date;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  language?: string;
  author?: string;
  title?: string;
  createdDate?: Date;
  modifiedDate?: Date;
}

export interface DocumentStructure {
  sections: DocumentSection[];
  headings: DocumentHeading[];
  paragraphs: DocumentParagraph[];
  lists: DocumentList[];
}

export interface DocumentSection {
  id: string;
  title: string;
  type: 'header' | 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'other';
  content: string;
  startPosition: number;
  endPosition: number;
  confidence: number;
}

export interface DocumentHeading {
  id: string;
  text: string;
  level: number;
  position: number;
}

export interface DocumentParagraph {
  id: string;
  text: string;
  position: number;
  section?: string;
}

export interface DocumentList {
  id: string;
  items: string[];
  type: 'bullet' | 'numbered';
  position: number;
  section?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  uploadedAt: Date;
  changes: DocumentChange[];
  metadata: DocumentMetadata;
}

export interface DocumentChange {
  type: 'added' | 'removed' | 'modified';
  section: string;
  oldContent?: string;
  newContent?: string;
  position: number;
}

class DocumentProcessingService {
  private static instance: DocumentProcessingService;
  private documentVersions: Map<string, DocumentVersion[]> = new Map();

  static getInstance(): DocumentProcessingService {
    if (!DocumentProcessingService.instance) {
      DocumentProcessingService.instance = new DocumentProcessingService();
    }
    return DocumentProcessingService.instance;
  }

  async processDocument(file: File): Promise<ProcessedDocument> {
    terminalLogger.info('DocumentProcessingService', 'Starting document processing', {
      filename: file.name,
      size: file.size,
      type: file.type
    });

    try {
      const documentId = this.generateDocumentId();
      let extractedText = '';
      let pages: DocumentPage[] = [];

      // Process based on file type
      switch (file.type) {
        case 'application/pdf':
          ({ extractedText, pages } = await this.processPDF(file));
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          ({ extractedText, pages } = await this.processDOCX(file));
          break;
        case 'text/plain':
          ({ extractedText, pages } = await this.processTXT(file));
          break;
        default:
          throw new Error(`Unsupported file type: ${file.type}`);
      }

      // Extract metadata
      const metadata = await this.extractMetadata(file, extractedText, pages.length);

      // Analyze document structure
      const structure = this.analyzeDocumentStructure(extractedText);

      const processedDocument: ProcessedDocument = {
        id: documentId,
        filename: file.name,
        content: extractedText,
        pages,
        metadata,
        extractedText,
        structure
      };

      // Store version
      this.storeDocumentVersion(processedDocument);

      terminalLogger.info('DocumentProcessingService', 'Document processing complete', {
        documentId,
        pageCount: pages.length,
        wordCount: metadata.wordCount,
        sections: structure.sections.length
      });

      return processedDocument;

    } catch (error) {
      terminalLogger.error('DocumentProcessingService', 'Document processing failed', {
        filename: file.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async processPDF(file: File): Promise<{ extractedText: string; pages: DocumentPage[] }> {
    // For now, we'll simulate PDF processing
    // In a real implementation, you would use pdf-parse or similar library
    const text = await this.readFileAsText(file);
    
    // Simulate PDF structure extraction
    const pages: DocumentPage[] = [{
      pageNumber: 1,
      content: text,
      dimensions: { width: 612, height: 792 }, // Standard letter size
      textBlocks: this.extractTextBlocks(text)
    }];

    return { extractedText: text, pages };
  }

  private async processDOCX(file: File): Promise<{ extractedText: string; pages: DocumentPage[] }> {
    // For now, we'll simulate DOCX processing
    // In a real implementation, you would use mammoth.js or similar library
    const text = await this.readFileAsText(file);
    
    const pages: DocumentPage[] = [{
      pageNumber: 1,
      content: text,
      dimensions: { width: 612, height: 792 },
      textBlocks: this.extractTextBlocks(text)
    }];

    return { extractedText: text, pages };
  }

  private async processTXT(file: File): Promise<{ extractedText: string; pages: DocumentPage[] }> {
    const text = await this.readFileAsText(file);
    
    const pages: DocumentPage[] = [{
      pageNumber: 1,
      content: text,
      dimensions: { width: 612, height: 792 },
      textBlocks: this.extractTextBlocks(text)
    }];

    return { extractedText: text, pages };
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          // Handle binary data (for PDF/DOCX, we'd need proper parsers)
          resolve('Document content extracted (binary format)');
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private extractTextBlocks(text: string): TextBlock[] {
    const lines = text.split('\n');
    const textBlocks: TextBlock[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        textBlocks.push({
          id: `block-${index}`,
          text: line.trim(),
          position: {
            x: 50,
            y: 50 + (index * 20),
            width: 500,
            height: 18
          },
          fontSize: 12,
          fontFamily: 'Arial',
          isBold: this.isBoldText(line),
          isItalic: false
        });
      }
    });

    return textBlocks;
  }

  private isBoldText(text: string): boolean {
    // Simple heuristic to detect headings/bold text
    return text.length < 50 && (
      text.toUpperCase() === text ||
      /^[A-Z][A-Z\s]+$/.test(text) ||
      text.endsWith(':')
    );
  }

  private async extractMetadata(file: File, content: string, pageCount: number): Promise<DocumentMetadata> {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    
    return {
      filename: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      pageCount,
      wordCount: words.length,
      characterCount: content.length,
      language: 'en', // Could be detected using language detection library
      createdDate: new Date(file.lastModified),
      modifiedDate: new Date(file.lastModified)
    };
  }

  private analyzeDocumentStructure(content: string): DocumentStructure {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const sections: DocumentSection[] = [];
    const headings: DocumentHeading[] = [];
    const paragraphs: DocumentParagraph[] = [];
    const lists: DocumentList[] = [];

    let currentPosition = 0;
    let currentSection: DocumentSection | null = null;

    lines.forEach((line, index) => {
      const position = currentPosition;
      currentPosition += line.length + 1;

      // Detect headings
      if (this.isHeading(line)) {
        const heading: DocumentHeading = {
          id: `heading-${index}`,
          text: line,
          level: this.getHeadingLevel(line),
          position
        };
        headings.push(heading);

        // Create new section
        if (currentSection) {
          currentSection.endPosition = position - 1;
          sections.push(currentSection);
        }

        currentSection = {
          id: `section-${sections.length}`,
          title: line,
          type: this.detectSectionType(line),
          content: '',
          startPosition: position,
          endPosition: position + line.length,
          confidence: 0.8
        };
      }
      // Detect lists
      else if (this.isList(line)) {
        // Handle list items
        const listItem = line.replace(/^[\s\-\*\+\d\.]\s*/, '');
        // Add to existing list or create new one
        // Simplified implementation
      }
      // Regular paragraphs
      else {
        const paragraph: DocumentParagraph = {
          id: `paragraph-${index}`,
          text: line,
          position,
          section: currentSection?.id
        };
        paragraphs.push(paragraph);

        if (currentSection) {
          currentSection.content += line + '\n';
          currentSection.endPosition = position + line.length;
        }
      }
    });

    // Close last section
    if (currentSection) {
      sections.push(currentSection);
    }

    return { sections, headings, paragraphs, lists };
  }

  private isHeading(line: string): boolean {
    // Detect common heading patterns
    return (
      line.length < 100 &&
      (
        line.toUpperCase() === line ||
        /^[A-Z][A-Z\s]+$/.test(line) ||
        line.endsWith(':') ||
        /^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CONTACT)/i.test(line)
      )
    );
  }

  private getHeadingLevel(line: string): number {
    if (line.length < 20) return 1;
    if (line.length < 40) return 2;
    return 3;
  }

  private detectSectionType(title: string): DocumentSection['type'] {
    const titleLower = title.toLowerCase();
    
    if (/contact|phone|email|address/i.test(titleLower)) return 'contact';
    if (/summary|objective|profile/i.test(titleLower)) return 'summary';
    if (/experience|work|employment|career/i.test(titleLower)) return 'experience';
    if (/education|degree|university|school/i.test(titleLower)) return 'education';
    if (/skills|technical|competencies/i.test(titleLower)) return 'skills';
    if (/projects|portfolio/i.test(titleLower)) return 'projects';
    
    return 'other';
  }

  private isList(line: string): boolean {
    return /^[\s]*[\-\*\+\d\.]\s+/.test(line);
  }

  private generateDocumentId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeDocumentVersion(document: ProcessedDocument): void {
    const versions = this.documentVersions.get(document.id) || [];
    const version: DocumentVersion = {
      id: `version-${versions.length + 1}`,
      documentId: document.id,
      version: versions.length + 1,
      uploadedAt: new Date(),
      changes: [], // Would be calculated by comparing with previous version
      metadata: document.metadata
    };
    
    versions.push(version);
    this.documentVersions.set(document.id, versions);
  }

  getDocumentVersions(documentId: string): DocumentVersion[] {
    return this.documentVersions.get(documentId) || [];
  }

  compareDocumentVersions(version1Id: string, version2Id: string): DocumentChange[] {
    // Implementation for comparing document versions
    // This would analyze differences between two versions
    return [];
  }
}

export const documentProcessingService = DocumentProcessingService.getInstance();