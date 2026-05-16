/**
 * Service d'optimisation performance pour analyse CV et génération documents
 * Compatible avec OpenAI et DeepSeek existants
 * Implémente cache, parallélisation et optimisations
 */

import { OpenAIClientService } from './openai-client';
import { chatCompletions } from './ai-chat';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresIn: number;
}

interface OptimizationConfig {
  enableCache: boolean;
  enableParallel: boolean;
  cacheExpiry: number; // en millisecondes
  useGPT35ForQuickTasks: boolean;
  enableStreaming: boolean;
}

export class PerformanceOptimizer {
  private cache = new Map<string, CacheEntry>();
  private openaiClient: OpenAIClientService;
  private config: OptimizationConfig;

  constructor() {
    this.openaiClient = new OpenAIClientService();
    this.config = {
      enableCache: true,
      enableParallel: true,
      cacheExpiry: 10 * 60 * 1000, // 10 minutes
      useGPT35ForQuickTasks: true,
      enableStreaming: false // Désactivé par défaut pour compatibilité
    };
  }

  /**
   * Génère un hash pour mise en cache basé sur le contenu CV
   */
  private generateCacheKey(prefix: string, content: string): string {
    // Hash simple et rapide basé sur les premiers et derniers caractères + longueur
    const start = content.substring(0, 100);
    const end = content.substring(content.length - 50);
    const hash = `${prefix}_${start.length}_${end.length}_${content.length}`;
    return hash.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Récupère du cache ou exécute la fonction
   */
  private async getCachedOrExecute<T>(
    cacheKey: string,
    executeFn: () => Promise<T>
  ): Promise<T> {
    if (!this.config.enableCache) {
      return executeFn();
    }

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.timestamp + cached.expiresIn) {
      console.log(`📦 Cache hit: ${cacheKey}`);
      return cached.data;
    }

    console.log(`🔄 Cache miss: ${cacheKey}`);
    const result = await executeFn();

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      expiresIn: this.config.cacheExpiry
    });

    return result;
  }

  /**
   * Analyse CV optimisée avec cache et parallélisation
   */
  async analyzeCV(cvText: string): Promise<{
    parsedData: any;
    suggestions: any[];
    reconversionSuggestions: any[];
  }> {
    const startTime = Date.now();

    if (!this.config.enableParallel) {
      // Mode séquentiel (fallback)
      const parsedData = await this.parseCV(cvText);
      const suggestions = await this.suggestJobs(cvText);
      const reconversionSuggestions = await this.suggestReconversionJobs(cvText);

      console.log(`⏱️ Analyse séquentielle: ${Date.now() - startTime}ms`);
      return { parsedData, suggestions, reconversionSuggestions };
    }

    // Mode parallèle optimisé
    console.log('🚀 Démarrage analyse parallèle...');

    const [parsedData, suggestions, reconversionSuggestions] = await Promise.all([
      this.parseCV(cvText),
      this.suggestJobs(cvText),
      this.suggestReconversionJobs(cvText)
    ]);

    console.log(`⚡ Analyse parallèle terminée: ${Date.now() - startTime}ms`);

    return {
      parsedData,
      suggestions,
      reconversionSuggestions
    };
  }

  /**
   * Parsing CV avec cache et optimisation modèle
   */
  async parseCV(cvText: string): Promise<any> {
    const cacheKey = this.generateCacheKey('parse', cvText);

    return this.getCachedOrExecute(cacheKey, async () => {
      console.log('🔍 Parsing CV...');

      // Utiliser GPT-3.5 pour parsing (plus rapide) ou GPT-4 selon config
      if (this.config.useGPT35ForQuickTasks) {
        try {
          return await this.parseCVWithGPT35(cvText);
        } catch (error) {
          console.log('⚠️ GPT-3.5 failed, fallback to existing system');
          return this.openaiClient.parseCV(cvText);
        }
      }

      return this.openaiClient.parseCV(cvText);
    });
  }

  /**
   * Suggestions métiers avec cache
   */
  async suggestJobs(cvText: string, isCustomOffer: boolean = false, jobOffer: string = ''): Promise<any[]> {
    const cacheKey = this.generateCacheKey(
      `suggest_${isCustomOffer ? 'custom' : 'standard'}`,
      cvText + jobOffer
    );

    return this.getCachedOrExecute(cacheKey, async () => {
      console.log('💼 Suggestions métiers...');
      return this.openaiClient.suggestJobs(cvText, isCustomOffer, jobOffer);
    });
  }

  /**
   * Suggestions reconversion avec cache
   */
  async suggestReconversionJobs(cvText: string, userLocation: string = 'Belgique'): Promise<any[]> {
    const cacheKey = this.generateCacheKey('reconversion', cvText + userLocation);

    return this.getCachedOrExecute(cacheKey, async () => {
      console.log('🔄 Suggestions reconversion...');
      return this.openaiClient.suggestReconversionJobs(cvText, userLocation);
    });
  }

  /**
   * Génération de documents avec optimisation
   */
  async generateDocument(
    type: string,
    validatedData: any,
    selectedJob: any,
    language: string,
    jobOffer?: string,
    userLocation: string = 'Belgique'
  ): Promise<string> {
    console.log(`📄 Génération ${type}...`);

    // Utiliser le service existant sans cache pour éviter les doublons
    return this.openaiClient.generateDocument(
      type,
      validatedData,
      selectedJob,
      language,
      jobOffer,
      userLocation
    );
  }

  /**
   * Parsing CV avec GPT-3.5 (plus rapide)
   */
  private async parseCVWithGPT35(cvText: string): Promise<any> {
    const systemMessage = `Tu es expert en extraction de données CV. Sois précis et rapide.`;

    const userMessage = `Extrais les données de ce CV en JSON strict:

CV: ${cvText}

Format JSON obligatoire:
{
  "personalInfo": {"firstName": "", "lastName": "", "email": "", "phone": "", "location": ""},
  "experiences": [{"company": "", "position": "", "startDate": "", "endDate": "", "description": "", "isCurrentJob": false}],
  "education": [{"institution": "", "degree": "", "field": "", "year": ""}],
  "skills": [],
  "languages": [{"language": "", "level": ""}]
}`;

    const response = await chatCompletions('openai', {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Pas de réponse de OpenAI');
    }

    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedContent);
  }

  /**
   * Nettoyage du cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache nettoyé');
  }

  /**
   * Statistiques du cache
   */
  getCacheStats(): { size: number; entries: string[] } {
    const entries = Array.from(this.cache.keys());
    return {
      size: this.cache.size,
      entries
    };
  }

  /**
   * Configuration des optimisations
   */
  configure(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuration optimisations:', this.config);
  }
}

// Instance singleton
export const performanceOptimizer = new PerformanceOptimizer();
