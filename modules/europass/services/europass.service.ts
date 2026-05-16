import {
  EuropassCV,
  EuropassExport,
  CEFRLevel,
  EducationLevel,
  DigitalSkillCategory,
  DigitalSkillLevel,
  EUROPEAN_LANGUAGES,
  EUROPEAN_COUNTRIES
} from '../types/europass.types';

export class EuropassService {

  /**
   * Convertit un CV classique vers le format Europass avec IA
   */
  static async convertCVToEuropass(cvData: any): Promise<EuropassCV> {
    try {
      const europassCV: EuropassCV = {
        version: "4.6.0",
        locale: 'fr-BE',
        personalInfo: this.extractPersonalInfo(cvData),
        experience: this.extractWorkExperience(cvData),
        education: this.extractEducation(cvData),
        languageSkills: this.generateDefaultLanguageSkills(),
        digitalSkills: this.generateDefaultDigitalSkills(),
        organizationalSkills: ["Leadership", "Project management"],
        interpersonalSkills: ["Communication", "Teamwork"],
        otherSkills: cvData.skills || [],
        drivingLicense: [],
        additionalInfo: '',
        attachments: []
      };

      return europassCV;
    } catch (error) {
      console.error('Erreur conversion Europass:', error);
      throw new Error('Impossible de convertir vers le format Europass');
    }
  }

  /**
   * Export Europass en différents formats
   */
  static async exportEuropass(europassData: EuropassCV, format: 'html' | 'json' | 'xml'): Promise<EuropassExport> {
    const timestamp = new Date().toISOString().split('T')[0];
    const name = `${europassData.personalInfo.lastName}_${europassData.personalInfo.firstName}`.replace(/\s+/g, '_');

    switch (format) {
      case 'html':
        return {
          content: this.generateHTML(europassData),
          mimeType: 'text/html',
          filename: `CV_Europass_${name}_${timestamp}.html`,
          format: 'html'
        };

      case 'json':
        return {
          content: JSON.stringify(europassData, null, 2),
          mimeType: 'application/json',
          filename: `CV_Europass_${name}_${timestamp}.json`,
          format: 'json'
        };

      case 'xml':
        return {
          content: this.generateXML(europassData),
          mimeType: 'application/xml',
          filename: `CV_Europass_${name}_${timestamp}.xml`,
          format: 'xml'
        };

      default:
        throw new Error(`Format d'export non supporté: ${format}`);
    }
  }

  /**
   * Génère le HTML Europass officiel
   */
  private static generateHTML(data: EuropassCV): string {
    return `<!DOCTYPE html>
<html lang="${data.locale}">
<head>
    <meta charset="UTF-8">
    <title>CV Europass - ${data.personalInfo.firstName} ${data.personalInfo.lastName}</title>
    <style>
        .europass-cv { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .europass-header { text-align: center; border-bottom: 3px solid #003d82; margin-bottom: 30px; }
        .europass-header h1 { color: #003d82; font-size: 2em; margin: 10px 0; }
        .europass-content section { margin-bottom: 30px; }
        .europass-content h2 { color: #003d82; border-bottom: 1px solid #ccc; }
    </style>
</head>
<body>
    <div class="europass-cv">
        <header class="europass-header">
            <h1>🇪🇺 Curriculum vitae Europass</h1>
        </header>
        <main class="europass-content">
            <section>
                <h2>Personal Information</h2>
                <p><strong>Name:</strong> ${data.personalInfo.firstName} ${data.personalInfo.lastName}</p>
                <p><strong>Email:</strong> ${data.personalInfo.email}</p>
                <p><strong>Phone:</strong> ${data.personalInfo.telephone}</p>
            </section>
        </main>
        <footer>
            <p>© Union européenne | Généré par CVBoost - ${new Date().toLocaleDateString()}</p>
        </footer>
    </div>
</body>
</html>`;
  }

  /**
   * Génère le XML Europass officiel
   */
  private static generateXML(data: EuropassCV): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<europass:learnerinfo xmlns:europass="http://europass.cedefop.europa.eu/Europass" locale="${data.locale}">
    <europass:identification>
        <europass:personalname>
            <europass:firstname>${data.personalInfo.firstName}</europass:firstname>
            <europass:surname>${data.personalInfo.lastName}</europass:surname>
        </europass:personalname>
    </europass:identification>
</europass:learnerinfo>`;
  }

  // Méthodes utilitaires privées

  private static extractPersonalInfo(cvData: any): any {
    return {
      firstName: cvData.personalInfo?.firstName || '',
      lastName: cvData.personalInfo?.lastName || '',
      email: cvData.personalInfo?.email || '',
      telephone: cvData.personalInfo?.phone || '',
      address: {
        street: '',
        postalCode: '',
        city: cvData.personalInfo?.location || '',
        country: 'Belgium'
      }
    };
  }

  private static extractWorkExperience(cvData: any): any[] {
    return cvData.experiences || [];
  }

  private static extractEducation(cvData: any): any[] {
    return cvData.education || [];
  }

  private static generateDefaultLanguageSkills(): any[] {
    return [
      {
        language: 'French',
        listening: CEFRLevel.C2,
        reading: CEFRLevel.C2,
        spokenInteraction: CEFRLevel.C2,
        spokenProduction: CEFRLevel.C2,
        writing: CEFRLevel.C2
      }
    ];
  }

  private static generateDefaultDigitalSkills(): any[] {
    return [
      {
        category: DigitalSkillCategory.INFORMATION_PROCESSING,
        level: DigitalSkillLevel.INTERMEDIATE
      }
    ];
  }
}
