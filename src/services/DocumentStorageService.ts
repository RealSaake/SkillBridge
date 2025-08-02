import { ProcessedDocument, DocumentVersion, DocumentMetadata } from './DocumentProcessingService';
import { terminalLogger } from '../utils/terminalLogger';

export interface StoredDocument {
  id: string;
  document: ProcessedDocument;
  versions: DocumentVersion[];
  createdAt: Date;
  lastModified: Date;
  tags: string[];
  isActive: boolean;
}

export interface DocumentSearchQuery {
  filename?: string;
  contentSearch?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  fileType?: string;
  sortBy?: 'date' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentSearchResult {
  documents: StoredDocument[];
  totalCount: number;
  searchTime: number;
}

class DocumentStorageService {
  private static instance: DocumentStorageService;
  private documents: Map<string, StoredDocument> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map(); // word -> document IDs

  static getInstance(): DocumentStorageService {
    if (!DocumentStorageService.instance) {
      DocumentStorageService.instance = new DocumentStorageService();
    }
    return DocumentStorageService.instance;
  }

  async storeDocument(document: ProcessedDocument, tags: string[] = []): Promise<string> {
    terminalLogger.info('DocumentStorageService', 'Storing document', {
      documentId: document.id,
      filename: document.filename,
      tags
    });

    try {
      const storedDocument: StoredDocument = {
        id: document.id,
        document,
        versions: [],
        createdAt: new Date(),
        lastModified: new Date(),
        tags,
        isActive: true
      };

      this.documents.set(document.id, storedDocument);
      this.updateSearchIndex(document);

      terminalLogger.info('DocumentStorageService', 'Document stored successfully', {
        documentId: document.id
      });

      return document.id;

    } catch (error) {
      terminalLogger.error('DocumentStorageService', 'Failed to store document', {
        documentId: document.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getDocument(documentId: string): Promise<StoredDocument | null> {
    const document = this.documents.get(documentId);
    
    if (document) {
      terminalLogger.debug('DocumentStorageService', 'Document retrieved', {
        documentId,
        filename: document.document.filename
      });
    }

    return document || null;
  }

  async updateDocument(documentId: string, updates: Partial<ProcessedDocument>): Promise<boolean> {
    const storedDocument = this.documents.get(documentId);
    
    if (!storedDocument) {
      return false;
    }

    try {
      // Create a new version before updating
      const currentVersion: DocumentVersion = {
        id: `version-${storedDocument.versions.length + 1}`,
        documentId,
        version: storedDocument.versions.length + 1,
        uploadedAt: new Date(),
        changes: [], // Would calculate actual changes
        metadata: storedDocument.document.metadata
      };

      storedDocument.versions.push(currentVersion);

      // Apply updates
      storedDocument.document = { ...storedDocument.document, ...updates };
      storedDocument.lastModified = new Date();

      // Update search index
      this.updateSearchIndex(storedDocument.document);

      terminalLogger.info('DocumentStorageService', 'Document updated', {
        documentId,
        version: currentVersion.version
      });

      return true;

    } catch (error) {
      terminalLogger.error('DocumentStorageService', 'Failed to update document', {
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    const document = this.documents.get(documentId);
    
    if (!document) {
      return false;
    }

    try {
      // Soft delete - mark as inactive
      document.isActive = false;
      document.lastModified = new Date();

      // Remove from search index
      this.removeFromSearchIndex(documentId);

      terminalLogger.info('DocumentStorageService', 'Document deleted', {
        documentId,
        filename: document.document.filename
      });

      return true;

    } catch (error) {
      terminalLogger.error('DocumentStorageService', 'Failed to delete document', {
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async searchDocuments(query: DocumentSearchQuery): Promise<DocumentSearchResult> {
    const startTime = Date.now();
    
    terminalLogger.debug('DocumentStorageService', 'Starting document search', {
      filename: query.filename,
      contentSearch: query.contentSearch,
      tags: query.tags,
      fileType: query.fileType
    });

    try {
      let results = Array.from(this.documents.values()).filter(doc => doc.isActive);

      // Apply filters
      if (query.filename) {
        const filenameRegex = new RegExp(query.filename, 'i');
        results = results.filter(doc => filenameRegex.test(doc.document.filename));
      }

      if (query.fileType) {
        results = results.filter(doc => doc.document.metadata.type === query.fileType);
      }

      if (query.tags && query.tags.length > 0) {
        results = results.filter(doc => 
          query.tags!.some(tag => doc.tags.includes(tag))
        );
      }

      if (query.contentSearch) {
        const searchTerms = query.contentSearch.toLowerCase().split(/\s+/);
        results = results.filter(doc => {
          const content = doc.document.extractedText.toLowerCase();
          return searchTerms.every(term => content.includes(term));
        });
      }

      if (query.dateRange) {
        results = results.filter(doc => {
          const docDate = doc.createdAt;
          return docDate >= query.dateRange!.start && docDate <= query.dateRange!.end;
        });
      }

      // Apply sorting
      if (query.sortBy) {
        results.sort((a, b) => {
          let comparison = 0;
          
          switch (query.sortBy) {
            case 'date':
              comparison = a.lastModified.getTime() - b.lastModified.getTime();
              break;
            case 'name':
              comparison = a.document.filename.localeCompare(b.document.filename);
              break;
            case 'size':
              comparison = a.document.metadata.size - b.document.metadata.size;
              break;
          }

          return query.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      const searchTime = Date.now() - startTime;

      terminalLogger.info('DocumentStorageService', 'Document search complete', {
        resultsCount: results.length,
        searchTime
      });

      return {
        documents: results,
        totalCount: results.length,
        searchTime
      };

    } catch (error) {
      terminalLogger.error('document_storage', 'Search error', {
        action: 'search_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getAllDocuments(): Promise<StoredDocument[]> {
    return Array.from(this.documents.values()).filter(doc => doc.isActive);
  }

  async getDocumentMetadata(documentId: string): Promise<DocumentMetadata | null> {
    const document = this.documents.get(documentId);
    return document ? document.document.metadata : null;
  }

  async addDocumentTags(documentId: string, tags: string[]): Promise<boolean> {
    const document = this.documents.get(documentId);
    
    if (!document) {
      return false;
    }

    const newTags = tags.filter(tag => !document.tags.includes(tag));
    document.tags.push(...newTags);
    document.lastModified = new Date();

    terminalLogger.info('document_storage', 'Tags added', {
      action: 'tags_added',
      documentId,
      newTags
    });

    return true;
  }

  async removeDocumentTags(documentId: string, tags: string[]): Promise<boolean> {
    const document = this.documents.get(documentId);
    
    if (!document) {
      return false;
    }

    document.tags = document.tags.filter(tag => !tags.includes(tag));
    document.lastModified = new Date();

    terminalLogger.info('document_storage', 'Tags removed', {
      action: 'tags_removed',
      documentId,
      removedTags: tags
    });

    return true;
  }

  private updateSearchIndex(document: ProcessedDocument): void {
    // Remove existing entries for this document
    this.removeFromSearchIndex(document.id);

    // Extract words from document content
    const words = this.extractSearchableWords(document.extractedText);
    
    // Add words to search index
    words.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word)!.add(document.id);
    });

    // Also index filename words
    const filenameWords = this.extractSearchableWords(document.filename);
    filenameWords.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word)!.add(document.id);
    });
  }

  private removeFromSearchIndex(documentId: string): void {
    this.searchIndex.forEach((documentIds, word) => {
      documentIds.delete(documentId);
      if (documentIds.size === 0) {
        this.searchIndex.delete(word);
      }
    });
  }

  private extractSearchableWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);
    
    return stopWords.has(word);
  }

  // Statistics and analytics
  async getStorageStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    averageSize: number;
    fileTypes: Record<string, number>;
    tagsUsage: Record<string, number>;
  }> {
    const activeDocuments = Array.from(this.documents.values()).filter(doc => doc.isActive);
    
    const totalSize = activeDocuments.reduce((sum, doc) => sum + doc.document.metadata.size, 0);
    const fileTypes: Record<string, number> = {};
    const tagsUsage: Record<string, number> = {};

    activeDocuments.forEach(doc => {
      // Count file types
      const type = doc.document.metadata.type;
      fileTypes[type] = (fileTypes[type] || 0) + 1;

      // Count tag usage
      doc.tags.forEach(tag => {
        tagsUsage[tag] = (tagsUsage[tag] || 0) + 1;
      });
    });

    return {
      totalDocuments: activeDocuments.length,
      totalSize,
      averageSize: activeDocuments.length > 0 ? totalSize / activeDocuments.length : 0,
      fileTypes,
      tagsUsage
    };
  }
}

export const documentStorageService = DocumentStorageService.getInstance();