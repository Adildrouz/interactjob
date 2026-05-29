import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose'],
  async headers() {
    return [
      {
        // Cache Next.js built assets (hashed filenames) forever
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache public images and favicon
        source: "/:file(InteractJob-Logo\\.png|favicon\\.png|favicon\\.ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Cache RSS feeds
        source: "/rss.xml",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/blog-rss.xml",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  async redirects() {
    return [
    // ── Non-www → www (fixes "Duplicate, Google chose different canonical") ──
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'interactjob.ma' }],
      destination: 'https://www.interactjob.ma/:path*',
      permanent: true,
    },
    // ── services-cv → generateur-cv (CV Pro remplacé par IA gratuit) ──
    { source: '/fr/services-cv', destination: '/fr/generateur-cv', permanent: true },
    { source: '/en/services-cv', destination: '/en/generateur-cv', permanent: true },
    { source: '/ar/services-cv', destination: '/ar/generateur-cv', permanent: true },
    { source: '/services-cv',    destination: '/generateur-cv',    permanent: true },
    {
      source: '/offres/remote/772f54f750e74775',
      destination: '/offres/remote/director-of-media-innovation-performance-marketing-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a6e13c3d09ea7154',
      destination: '/offres/remote/semiconductor-software-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ff1e26340e3447f2',
      destination: '/offres/remote/sales-account-executive-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/13ba954910fb0ee6',
      destination: '/offres/remote/senior-project-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ee7d4daf6b4a65d1',
      destination: '/offres/remote/head-of-pipeline-growth-integrated-campaigns-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f7639c4f1b961a5b',
      destination: '/offres/remote/principal-financial-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0089015474da004e',
      destination: '/offres/remote/cmmc-compliance-analyst-remote-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/64bf6542e02d60e8',
      destination: '/offres/remote/german-speaking-rent-a-car-consultant-work-in-bulgaria-paid-relocation-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e3aab19441ef9ff4',
      destination: '/offres/remote/senior-recruiter-ii-product-management-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2e68aa9efaee68a0',
      destination: '/offres/remote/senior-analytics-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f42a3cdaeef0f241',
      destination: '/offres/remote/sr-named-account-manager-nordics-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d79790cb50bd8006',
      destination: '/offres/remote/global-tax-accountant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8c9d60fa80171cc6',
      destination: '/offres/remote/systems-integration-developer-amadeus-automation-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1996feb407c4eac3',
      destination: '/offres/remote/lead-software-developer-remote-full-time-hr173-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/58dba29593bb9ea1',
      destination: '/offres/remote/principal-partner-marketing-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0e8bf0219595d536',
      destination: '/offres/remote/entry-level-ux-design-apprenticeship-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c36cf8c5358ca736',
      destination: '/offres/remote/senior-software-engineer-scanning-engine-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b22d8686540e5a94',
      destination: '/offres/remote/client-accounts-receivable-specialist-i-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/53f017d5645f1d4c',
      destination: '/offres/remote/search-engine-optimization-seo-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a9279d882d4533d8',
      destination: '/offres/remote/staff-software-engineer-greenplum-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7273ec176d9ed3a2',
      destination: '/offres/remote/manager-client-success-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b0df623de26c3aa7',
      destination: '/offres/remote/virtual-family-nurse-practitioner-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d6e8f351aad003df',
      destination: '/offres/remote/tax-accountant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d108591611883ac1',
      destination: '/offres/remote/senior-site-reliability-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/31423818e276951c',
      destination: '/offres/remote/technical-administrative-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e90d5e9687a376f9',
      destination: '/offres/remote/operations-coordinator-part-time-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ad65f923b0f4a727',
      destination: '/offres/remote/conseillerere-gestion-des-reclamations-cnesst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c6613a9bf3b299e5',
      destination: '/offres/remote/associate-director-pharmacovigilance-pv-operations-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c921613a4cf3f8d9',
      destination: '/offres/remote/green-career-essentials-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4c1afe44bda090f0',
      destination: '/offres/remote/merchandiser-auditor-position-available-pinckneyville-il-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5f5ade395627ca0c',
      destination: '/offres/remote/remote-india-accountant-finance-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7b136466ed945284',
      destination: '/offres/remote/executive-partner-cio-advisory-state-local-government-clients-east-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/829b175bef83e8b5',
      destination: '/offres/remote/sap-btp-business-technology-platform-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/acc3ed1ae980c436',
      destination: '/offres/remote/regional-sales-manager-payments-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c86ad8248316b592',
      destination: '/offres/remote/linguistic-ai-auditor-hindi-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f67370b2b7c2a9ef',
      destination: '/offres/remote/technical-support-specialist-freelance-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8f89f4b582a08076',
      destination: '/offres/remote/enterprise-account-executive-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f80c7464fb90b6d5',
      destination: '/offres/remote/partnerships-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d704ddd8e01cb476',
      destination: '/offres/remote/senior-associate-finance-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/474d00f7b276fcb9',
      destination: '/offres/remote/chief-innovation-officer-cino-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3f4c4cb0f0d84cea',
      destination: '/offres/remote/data-success-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/048c27fa958fac40',
      destination: '/offres/remote/ai-data-intelligence-lead-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aa8e5c523fbba1d2',
      destination: '/offres/remote/social-media-manager-video-editor-part-time-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/159cd1407326ce29',
      destination: '/offres/remote/software-development-engineer-in-test-sdet-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e452bc93cc3dcf0e',
      destination: '/offres/remote/principal-performance-engineer-database-ai-benchmarking-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aee90a97093d98d2',
      destination: '/offres/remote/senior-associate-transaction-advisory-services-healthcare-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2fe90ef1751b4ff3',
      destination: '/offres/remote/linguistic-ai-auditor-bengali-india-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d2f2398cbaf8e29a',
      destination: '/offres/remote/customer-success-manager-major-accounts-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d668c65d91a43839',
      destination: '/offres/remote/vp-of-sales-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e99af932b71f64f1',
      destination: '/offres/remote/product-designer-creators-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ce24462501e27078',
      destination: '/offres/remote/backend-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/97a98eeaac5e17a4',
      destination: '/offres/remote/pharmaceutical-associate-21599-boston-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a8e29bb483528209',
      destination: '/offres/remote/property-manager-rent-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9755b32b3f5ae533',
      destination: '/offres/remote/associate-medical-director-drug-safety-and-pharmacovigilance-pv-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/130c2b3408edef5d',
      destination: '/offres/remote/hadoop-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3af9977720c108d9',
      destination: '/offres/remote/head-of-accounting-north-america-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/84cf255b10891362',
      destination: '/offres/remote/lead-clinical-data-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/491c1363a6df93bf',
      destination: '/offres/remote/sales-executive-moda-france-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/587bec55393f95b6',
      destination: '/offres/remote/account-executive-manager-key-accounts-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7af469d548415144',
      destination: '/offres/remote/social-media-marketer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4a22f5ca58dbda1a',
      destination: '/offres/remote/sector-demand-planning-siop-lead-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4193d4006c134cd1',
      destination: '/offres/remote/regional-sales-manager-existing-accounts-remote-uae-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ea9bcd98071579b6',
      destination: '/offres/remote/marketing-intern-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/51224b0eb10e0c3b',
      destination: '/offres/remote/executive-assistant-to-the-director-of-legal-operations-colombia-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/14bb12809822c924',
      destination: '/offres/remote/senior-partner-growth-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/37622225f63ebe87',
      destination: '/offres/remote/dutch-speaking-advisor-for-an-online-payment-platform-work-in-bulgaria-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/cf56aa37c16d22b1',
      destination: '/offres/remote/windchill-integration-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/def6514802791033',
      destination: '/offres/remote/manager-customer-success-entophth-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/03eafe95c3acfaa1',
      destination: '/offres/remote/account-executive-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9d8f28ada6be5ca1',
      destination: '/offres/remote/swedish-speaking-customer-support-specialist-work-in-bulgaria-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0c0df3478ce09082',
      destination: '/offres/remote/hr-administrator-administrative-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b13ac1b040373303',
      destination: '/offres/remote/network-development-operations-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4ba34e4bf26fe28d',
      destination: '/offres/remote/boomi-integration-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7464fa140a31694c',
      destination: '/offres/remote/principal-software-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aded2a12baad02c8',
      destination: '/offres/remote/international-finance-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/dd78fa0541a16303',
      destination: '/offres/remote/smb-program-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/992156a7df350711',
      destination: '/offres/remote/linguistic-ai-auditor-brazilian-portuguese-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4c8f921b93bd32e8',
      destination: '/offres/remote/oracle-dba-data-processing-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/732323b3d58fcd0e',
      destination: '/offres/remote/remote-national-medical-director-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/60b01bcdcffa1b23',
      destination: '/offres/remote/senior-manager-internal-communications-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7ad0799cf6fa74ab',
      destination: '/offres/remote/enterprise-applications-manager-it-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0d22cf730d105eaf',
      destination: '/offres/remote/crm-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/33a3ff525345c51f',
      destination: '/offres/remote/arabic-speaking-digital-trust-and-safety-specialist-work-in-sofia-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e9d35ed29f0b0f5a',
      destination: '/offres/remote/analista-de-garantia-da-qualidade-qa-pleno-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/210f22efe2f29bbe',
      destination: '/offres/remote/sr-manager-data-center-controls-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/02d4e918efcc43e6',
      destination: '/offres/remote/finance-support-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7e8382a1f8db276b',
      destination: '/offres/remote/associate-commercial-counsel-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3b2c45eb296a7179',
      destination: '/offres/remote/government-contracts-attorney-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bee66564f5071f33',
      destination: '/offres/remote/chief-innovation-officer-cino-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/57c83834c74f280a',
      destination: '/offres/remote/linguistic-ai-auditor-indonesian-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/78942de5ce2681a8',
      destination: '/offres/remote/instructional-designer-home-services-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a4a254b71f97f3a4',
      destination: '/offres/remote/senior-content-marketing-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b5feb6158626df33',
      destination: '/offres/remote/senior-full-stack-software-engineer-fmd-react-nodejs-hamburg-hh-de-2-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b8c779ebefc6df53',
      destination: '/offres/remote/workforce-management-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3adf45bac2e526fe',
      destination: '/offres/remote/manager-gtm-marketing-audiences-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ec9e20030a12f706',
      destination: '/offres/remote/director-emergency-management-recovery-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a32ffc1a8f82937f',
      destination: '/offres/remote/senior-technical-account-manager-atlas-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/55196754e46a5b49',
      destination: '/offres/remote/director-of-products-storage-security-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/587387ddbfadb9cb',
      destination: '/offres/remote/merchandiser-auditor-position-available-marquette-mi-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4b0a257623c7e43a',
      destination: '/offres/remote/technology-solutions-consultant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2d7c08aca08633a0',
      destination: '/offres/remote/enterprise-account-executive-us-ca-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/538efae7516de467',
      destination: '/offres/remote/pessoa-engenheira-de-plataforma-pleno-developer-experience-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b0958248b088a083',
      destination: '/offres/remote/spanish-speaking-customer-experts-for-airline-work-in-greece-paid-relocation-rem',
      permanent: true,
    },
    {
      source: '/offres/remote/cbb3502ec3b20493',
      destination: '/offres/remote/dsai-tech-leader-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d7b9e8aad3f36d25',
      destination: '/offres/remote/implementation-product-manager-home-lending-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5e1c42ea5fb10125',
      destination: '/offres/remote/founding-engineer-3m-pre-seed-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7cadd76904b0863b',
      destination: '/offres/remote/deputy-program-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7c2394ba1dc1c05d',
      destination: '/offres/remote/senior-quality-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7e640e6dfbb49729',
      destination: '/offres/remote/product-analyst-gtm-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1fa9e882ca783025',
      destination: '/offres/remote/sales-analytics-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e2dbabb54498b474',
      destination: '/offres/remote/it-service-management-servicenow-2794-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/640153b5a15bd2a7',
      destination: '/offres/remote/commerce-media-senior-specialist-search-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f160aa3fbe877874',
      destination: '/offres/remote/senior-director-data-platform-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e440977e62c409d7',
      destination: '/offres/remote/creative-content-production-lead-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3e56e24a0d8f16fe',
      destination: '/offres/remote/associate-director-messaging-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f7b272b2e1be50f3',
      destination: '/offres/remote/commercial-auto-claims-representative-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4cc270274a00f0e7',
      destination: '/offres/remote/healthcare-reclamation-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ff55c3132df46188',
      destination: '/offres/remote/1099-telemedicine-internalfamily-medicine-mddo-flexible-schedule-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6b17f88377df2f6f',
      destination: '/offres/remote/sw-ontario-technical-sales-representative-remote-mississauga-on-ca-l5s-1n9-remot',
      permanent: true,
    },
    {
      source: '/offres/remote/e0f2a3a72ce8c00d',
      destination: '/offres/remote/pigment-solution-architect-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e48f1db10272edbd',
      destination: '/offres/remote/machine-learning-engineer-inference-optimization-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/cc89fb3e48d66285',
      destination: '/offres/remote/key-corporate-account-director-northeast-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/23a3a8ce036b4af2',
      destination: '/offres/remote/senior-salesforce-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9253e17f2fc77061',
      destination: '/offres/remote/rebate-specialist-simpro-crm-exp-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6da93fb40e06f2aa',
      destination: '/offres/remote/paylocity-operations-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e5e77718f5623b31',
      destination: '/offres/remote/senior-consultant-pharmacy-business-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d16c6b53b2caa254',
      destination: '/offres/remote/systems-architect-integrations-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/210f10a8fefe2fc0',
      destination: '/offres/remote/ics-technical-directorrd-strategist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/84271844cbd9dc7e',
      destination: '/offres/remote/salesforce-architect-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a2de2deab64df917',
      destination: '/offres/remote/people-operations-specialists-remote-contract-east-coast-only-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6dadd19787740d46',
      destination: '/offres/remote/quality-assurance-supervisor-clinical-rn-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9ac7fa1d4589d723',
      destination: '/offres/remote/technical-support-engineer-iasm-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e9983a087d8b6ba0',
      destination: '/offres/remote/event-planning-specialist-fully-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/478970e89a7ae556',
      destination: '/offres/remote/executive-director-quality-systems-operational-excellence-lead-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/74fe818870e6d4b2',
      destination: '/offres/remote/senior-finance-manager-public-sector-remote-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/500fac815625f03d',
      destination: '/offres/remote/professeur-de-droit-enseignant-cours-particuliers-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f392a5cb6b20c2fb',
      destination: '/offres/remote/principal-software-engineer-11498-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a3baefb9a42e4c44',
      destination: '/offres/remote/strong-middlesenior-project-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/cb9ca7333808ffa3',
      destination: '/offres/remote/pediatric-mental-health-therapist-virtual-care-washington-part-time-flexi-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8a5ac7d7dc28e303',
      destination: '/offres/remote/direct-sales-account-executive-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b26d6df25e8ba460',
      destination: '/offres/remote/director-engineering-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/86f4a0b465b7b5b1',
      destination: '/offres/remote/enterprise-account-executive-business-development-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4602b1caa18d8067',
      destination: '/offres/remote/content-creator-and-operations-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b1c0a63ec4273656',
      destination: '/offres/remote/senior-supply-chain-associate-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5aad7bfffa2f7934',
      destination: '/offres/remote/vp-of-product-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f5e01fab6c1d4c01',
      destination: '/offres/remote/volunteer-position-logos-circles-technical-steward-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6c7d5eec73f6a8a2',
      destination: '/offres/remote/event-marketing-intern-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/05dfb731d3beb690',
      destination: '/offres/remote/machine-learning-engineer-ai-architecture-research-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8c936a15760411dd',
      destination: '/offres/remote/software-engineer-iii-javaangularapi-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1c23688ee5f1937c',
      destination: '/offres/remote/high-ticket-closer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4ed082d1da337358',
      destination: '/offres/remote/patient-support-coordinator-healthtech-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9b8385701864835b',
      destination: '/offres/remote/staff-forward-deployed-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/cb6e10bf3d9c9d7e',
      destination: '/offres/remote/senior-software-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8ba54876061ec34c',
      destination: '/offres/remote/regional-sales-manager-midwest-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5489a5a86effb630',
      destination: '/offres/remote/senior-international-sales-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/65f6e2c7697b8b6d',
      destination: '/offres/remote/senior-tax-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/78175e6e7cb2ee5e',
      destination: '/offres/remote/senior-qa-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/81d4423072f14181',
      destination: '/offres/remote/senior-commercial-pricing-analyst-mfd-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3900ae41e7aeeb09',
      destination: '/offres/remote/business-development-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9adab308d2f25cdb',
      destination: '/offres/remote/senior-sap-mm-pp-functional-consultant-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/486e71f4174f21b2',
      destination: '/offres/remote/software-engineer-ios-core-product-virginia-beach-va-usa-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4c3c58cff6196f1e',
      destination: '/offres/remote/ai-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1808a5ad3036f6fd',
      destination: '/offres/remote/software-architect-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a8172280791ad1c4',
      destination: '/offres/remote/claims-adjuster-trucking-apd-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/764ffd5c88992fc4',
      destination: '/offres/remote/senior-product-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/84681e9d07e810fa',
      destination: '/offres/remote/director-global-field-events-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/835358f7d8e207ed',
      destination: '/offres/remote/revenue-operations-director-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/763a3a760844f1e2',
      destination: '/offres/remote/growth-marketing-director-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ac591dda3236d908',
      destination: '/offres/remote/editorial-marketing-copywriter-intern-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9e51345ddebaaa69',
      destination: '/offres/remote/founding-engineer-3m-pre-seed-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7e622b9c337a8213',
      destination: '/offres/remote/azure-data-engineer-remote-latin-america-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c007025c491f6a1f',
      destination: '/offres/remote/product-marketing-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/14945a76b4531d0c',
      destination: '/offres/remote/spanish-sales-development-representative-freelance-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f08b5d48eacde8ee',
      destination: '/offres/remote/regional-sales-manager-climate-control-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7ebf9a6b72ca7075',
      destination: '/offres/remote/summer-internship-ai-engineering-intern-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7987307066b4c1c0',
      destination: '/offres/remote/system-administrator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1cf7b76150c39b1a',
      destination: '/offres/remote/remote-account-growth-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/add0e3ec6278f520',
      destination: '/offres/remote/account-executive-3-enterprise-direct-sales-managed-solutions-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bff9e4a9019bb752',
      destination: '/offres/remote/field-medical-advisor-cardiorenal-netherlands-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/79bbcd1e55d69b76',
      destination: '/offres/remote/principal-clinical-insights-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ff1c371c27700efb',
      destination: '/offres/remote/window-treatment-design-consultant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b0c718133ad62950',
      destination: '/offres/remote/designer-ii-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/eb33d89c897ec20a',
      destination: '/offres/remote/fall-co-op-2026-disability-operations-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9abd299e5df29f13',
      destination: '/offres/remote/software-development-engineer-ii-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b5c03252d300b304',
      destination: '/offres/remote/senior-associate-of-strategy-business-operations-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e8a96bc3abb6e0ee',
      destination: '/offres/remote/adjunct-faculty-robert-w-plaster-school-of-business-graduate-online-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/816aad3187f0cb5e',
      destination: '/offres/remote/construction-project-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/794094a736e9babb',
      destination: '/offres/remote/staff-backend-engineer-grafana-app-platform-germany-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b86e63034995117e',
      destination: '/offres/remote/manager-contracts-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f01098296e3f2c27',
      destination: '/offres/remote/technical-qa-analyst-ii-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/84ce4249d604bbec',
      destination: '/offres/remote/senior-product-analyst-bnpl-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/06bd5e5446f4c307',
      destination: '/offres/remote/network-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f53d8aa6449c6932',
      destination: '/offres/remote/recruitment-consultant-technology-poland-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/08f0a773a6f895f7',
      destination: '/offres/remote/project-manager-iii-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ee54cd631a9f5966',
      destination: '/offres/remote/senior-procurement-consultant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4a8aa62ce8c050fb',
      destination: '/offres/remote/financial-analyst-fpa-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/74fb23c0c4d55191',
      destination: '/offres/remote/senior-application-security-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/cdf8de95d0e34829',
      destination: '/offres/remote/senior-fire-scientist-spain-only-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b8041fcf004d8fc7',
      destination: '/offres/remote/ai-automation-builder-people-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/95fc71f0aec426d2',
      destination: '/offres/remote/project-manager-softwareweb-development-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/614b83f2d0129dc5',
      destination: '/offres/remote/data-annotator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2d6bb61aef870055',
      destination: '/offres/remote/amazon-brand-development-launch-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6a31878c20cf21e8',
      destination: '/offres/remote/remote-structural-or-architectural-project-coordinator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/136d046a2d6e3b79',
      destination: '/offres/remote/southeast-se-cohort-project-manager-distressed-borrowers-assistance-network-remo',
      permanent: true,
    },
    {
      source: '/offres/remote/102b3f2f6d83585d',
      destination: '/offres/remote/product-content-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9fff70a0eb22c1e8',
      destination: '/offres/remote/frontend-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6ea16b730b59e4bb',
      destination: '/offres/remote/vp-data-cloud-consulting-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a7a30624f29e079a',
      destination: '/offres/remote/client-solutions-manager-remote-plano-tx-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0cac23587c598a97',
      destination: '/offres/remote/senior-customer-success-engineer-tola-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/fc79c61e6f8b870b',
      destination: '/offres/remote/martech-operations-analyst-braze-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a5bbeb21c786a63b',
      destination: '/offres/remote/freelance-outplacement-coach-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/18d134be002baa8f',
      destination: '/offres/remote/clinical-psychologist-part-time-or-license-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ffdd03a2315bdcd5',
      destination: '/offres/remote/recruiting-coordinator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/afbb80435b9650ef',
      destination: '/offres/remote/consultor-senior-de-ventas-educativas-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1c01f32c600ec828',
      destination: '/offres/remote/mid-market-account-executive-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/dec0d3aa9fdcdff0',
      destination: '/offres/remote/spanish-speaking-search-engine-customer-expert-work-in-greece-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3ec36788d90d46e0',
      destination: '/offres/remote/manager-retrieval-operations-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/244cb0de4be9c643',
      destination: '/offres/remote/senior-manager-strategic-finance-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aef69609765be26e',
      destination: '/offres/remote/analista-de-suporte-middleware-jr-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/55d89a05cadfd81b',
      destination: '/offres/remote/creative-strategist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/63a8f7ca79338377',
      destination: '/offres/remote/motor-adjuster-adtp-uk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ecc55af6e50a89d5',
      destination: '/offres/remote/azure-data-engineer-remote-latin-america-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d1da7c0601d8f6ac',
      destination: '/offres/remote/lead-ai-engineer-11510-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/fdcddc4d732f5767',
      destination: '/offres/remote/1095-power-bi-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/105c1b8c328a6ab1',
      destination: '/offres/remote/senior-risk-management-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d70b1f6f7fb48fe4',
      destination: '/offres/remote/director-of-solutions-engineering-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/45187e4739a5a739',
      destination: '/offres/remote/intern-operations-executive-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/48e3a4a2e2a7c6ed',
      destination: '/offres/remote/customer-succes-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c9148bf991947080',
      destination: '/offres/remote/construction-project-coordinator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/fe7b42b408c25264',
      destination: '/offres/remote/principal-product-manager-discovery-onboardingexchange-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/050432bd0d15305c',
      destination: '/offres/remote/head-of-content-marketing-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1d86f1fb2bbc41c2',
      destination: '/offres/remote/amazon-inventory-recovery-unfulfillable-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ff6a0fd1ffc196c8',
      destination: '/offres/remote/azure-data-engineer-remote-latin-america-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/eca34a7111657e27',
      destination: '/offres/remote/marketplace-reporting-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4117e7efbd2bc097',
      destination: '/offres/remote/project-manager-it-technology-transformation-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/faf6a0bbf88c090d',
      destination: '/offres/remote/senior-information-risk-consultant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bdb9ff50a6834849',
      destination: '/offres/remote/managing-director-fluent-software-group-canada-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/011d602a2a4ed836',
      destination: '/offres/remote/systems-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b0efb07aa3119260',
      destination: '/offres/remote/full-stack-product-developer-javascript-c-aspnet-ms-tech-stack-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/28ee845b75c1becb',
      destination: '/offres/remote/responsable-solution-energie-solution-manager-energy-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2ce3a0450d6c9a6a',
      destination: '/offres/remote/physician-advisory-services-customer-service-representative-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/14d4d6359a2bd8a7',
      destination: '/offres/remote/product-owner-data-analytics-ai-tieto-indtech-mfd-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bdeefee87c1ec68a',
      destination: '/offres/remote/business-development-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/79d7d461e007ca64',
      destination: '/offres/remote/care-path-educator-tzield-atlanta-ga-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c8d670ac82265aed',
      destination: '/offres/remote/regulatory-affairs-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e91e0637eae5acac',
      destination: '/offres/remote/customer-service-representative-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/809da810d91f30e8',
      destination: '/offres/remote/metadata-management-specialist-colibra-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bd5270e66ee00ef9',
      destination: '/offres/remote/category-manager-sneakers-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/687a546a85663b11',
      destination: '/offres/remote/software-implementation-consultant-treasury-debt-management-sympro-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f7a55be9bec8fe09',
      destination: '/offres/remote/sr-director-analyst-sourcing-and-procurement-technology-expert-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/654e6288ce83f9f3',
      destination: '/offres/remote/claims-examiner-remote-remote-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aad7be62ff9b3e9d',
      destination: '/offres/remote/finance-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7af04a1f8c0e7ab0',
      destination: '/offres/remote/it-operationssupport-lead-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c7eeb76320214ba6',
      destination: '/offres/remote/global-time-attendance-product-strategy-lead-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/10f88156f9c108e2',
      destination: '/offres/remote/patient-care-coordinator-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/47ccd08c13d29e33',
      destination: '/offres/remote/administrative-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f98fe04923175646',
      destination: '/offres/remote/estimation-and-plan-takeoffs-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/09b503bdb34ed9fa',
      destination: '/offres/remote/appointment-setter-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/61088a514c1e278b',
      destination: '/offres/remote/spanish-speaking-cybersecurity-customer-agent-work-in-greece-paid-relocation-rem',
      permanent: true,
    },
    {
      source: '/offres/remote/9b64a3556f10dfdd',
      destination: '/offres/remote/afterschool-activity-leader-merchant-taylors-prep-school-wd3-1lw-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/dc7eeeae3de2ce42',
      destination: '/offres/remote/senior-sre-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b287c47012ff76d3',
      destination: '/offres/remote/it-project-coordinator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4d54db8cf04886d6',
      destination: '/offres/remote/high-tech-executive-partner-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a20ef2d06cd9361e',
      destination: '/offres/remote/lifecycle-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bbd1637437602944',
      destination: '/offres/remote/scrum-masterproject-manageroffshore-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b1ca486f7d8cc41d',
      destination: '/offres/remote/claims-quality-auditor-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d0d50f15e1b40ae9',
      destination: '/offres/remote/senior-accountant-remote-friendly-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ab87263fb12a8e9e',
      destination: '/offres/remote/ai-developer-generative-ai-llm-systems-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c6c7fd7428b9b7c8',
      destination: '/offres/remote/assistente-de-sucesso-do-cliente-clt-remoto-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1b67569b970014b7',
      destination: '/offres/remote/senior-database-site-reliability-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e5dbc2a76ec83568',
      destination: '/offres/remote/remote-executive-director-great-worklife-balance-with-an-easy-going-flexib-remot',
      permanent: true,
    },
    {
      source: '/offres/remote/a8ed9541b841d828',
      destination: '/offres/remote/digital-product-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a2ff0b181f529bf5',
      destination: '/offres/remote/sr-hr-associate-shared-services-9-month-fixed-term-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a710a763f8b4ec0d',
      destination: '/offres/remote/account-executive-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a2814a066d66e4e3',
      destination: '/offres/remote/consultora-senior-ping-identity-cyber-iam-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/df181f70a6650241',
      destination: '/offres/remote/bilingual-functional-rehabilitation-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/fe3fc9b73dda48e5',
      destination: '/offres/remote/client-relationship-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/68fb6ce376951327',
      destination: '/offres/remote/senior-database-administrator-mfd-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e0434643d0effcc3',
      destination: '/offres/remote/mortgage-loan-closer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bb44d279f87fe8ec',
      destination: '/offres/remote/cisco-alliance-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/70ed756ef4353d01',
      destination: '/offres/remote/pediatric-diagnostic-psychologist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6b9fdf772f49723a',
      destination: '/offres/remote/consultant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e48e9d8e2e683085',
      destination: '/offres/remote/senior-sales-business-development-representative-ovid-synthesis-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/75b5f4f353125b44',
      destination: '/offres/remote/medical-review-nurse-home-health-auditor-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/40df23b728c04874',
      destination: '/offres/remote/business-development-sr-manager-aerospace-remote-pa-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/10274707d97f725a',
      destination: '/offres/remote/customer-success-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/60cc6d4bfabc3b52',
      destination: '/offres/remote/compliance-counsel-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/625b7803d07a944c',
      destination: '/offres/remote/technical-support-engineer-tier-3-healthcaresaasehrmysql-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b5b6e9438b2c122b',
      destination: '/offres/remote/physician-recruiter-remote-texas-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6c6881ab3c881012',
      destination: '/offres/remote/manager-information-technology-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/937818d80ed3eae1',
      destination: '/offres/remote/senior-events-marketing-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/06e3ed9af818bf13',
      destination: '/offres/remote/sr-director-analyst-analytics-ai-remote-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/03ec89800951c311',
      destination: '/offres/remote/accounts-receivable-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e1dccb953797e5cd',
      destination: '/offres/remote/remote-accountant-full-time-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/baae45803b25587a',
      destination: '/offres/remote/dsp-advertising-strategist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0bb329e6bf4e7211',
      destination: '/offres/remote/director-research-system-analytics-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a289cccc787a4322',
      destination: '/offres/remote/microsoft-sql-server-engineer-remote-in-us-plano-tx-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/114f6963ba3020bb',
      destination: '/offres/remote/hubspot-automation-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7cc6f858a5f7d570',
      destination: '/offres/remote/principal-commercial-data-architect-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/925bf025928b66d7',
      destination: '/offres/remote/physician-clinical-reviewer-rheumatology-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c423eadfa23a0ad7',
      destination: '/offres/remote/network-detection-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a51198590e94a1a3',
      destination: '/offres/remote/af-co-design-sophomore-summit-summer-2026-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/899e4c244b6a41a7',
      destination: '/offres/remote/e-commerce-marketplace-listings-seo-specialist-freelance-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1e2800c71f3c2b9e',
      destination: '/offres/remote/investigative-journalist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b183fbf03731b49f',
      destination: '/offres/remote/journalist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1bba3500bb9ff0f2',
      destination: '/offres/remote/maintenance-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c162c8e97be04c96',
      destination: '/offres/remote/junior-graphic-designer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f7fe717d2ff4df4c',
      destination: '/offres/remote/hr-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/76ea9602f7f50d19',
      destination: '/offres/remote/hr-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5a43457d75d1301f',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/67d737d64a2740c5',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b9756f98ad969522',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8cd8a931bb3555b2',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/cef233b00cd265b5',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/31b4996d11c62672',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9e7c25dbf998fc08',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/498894a6a650b992',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9afd6d29c105aedd',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/04305672f0fd8277',
      destination: '/offres/remote/email-support-representative-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e40da993ca77e413',
      destination: '/offres/remote/email-support-representative-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2c104af2ba127fcc',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/eec00082905535c3',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/92586bf1f89e7df0',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/152d1139a1483e48',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/42ef1eee4a14a205',
      destination: '/offres/remote/employers-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/130dabcfcd2a9ade',
      destination: '/offres/remote/generalist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4d448176a8030689',
      destination: '/offres/remote/word-document-specialist-fully-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5a519b2ff56425e6',
      destination: '/offres/remote/graphic-designer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f8f06b0c848214d5',
      destination: '/offres/remote/curriculum-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3854057239f03248',
      destination: '/offres/remote/virtual-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/958de09d9c73ebc2',
      destination: '/offres/remote/docentes-de-licenciatura-online-uane-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/68e10b683f7fa773',
      destination: '/offres/remote/assistente-administrativo-cobranaa-clt-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/93e0e20e593d6daf',
      destination: '/offres/remote/suporte-help-desk-n1-clt-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e86e8447b9135f04',
      destination: '/offres/remote/project-coordinator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8aedec27dcc6fb56',
      destination: '/offres/remote/virtual-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/42c446eddb0c7663',
      destination: '/offres/remote/data-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/12b72548b944da42',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0c3214895a8ec489',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6f8fc3218d3d6b04',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2be2612e9eba1920',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8334b07c1885f1fa',
      destination: '/offres/remote/data-entry-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/cc9bf6a623604738',
      destination: '/offres/remote/flentx-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/53fb249226e55c26',
      destination: '/offres/remote/social-media-content-creator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2c5392a6bc6470b0',
      destination: '/offres/remote/product-designer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/550393d1176ef9ca',
      destination: '/offres/remote/directeur-audio-audio-director-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4757c110b8cbc86c',
      destination: '/offres/remote/speechify-inc-senior-software-engineer-platform-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b1da7595228d45aa',
      destination: '/offres/remote/speechify-inc-senior-software-engineer-web-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6ff8273e5c0250d0',
      destination: '/offres/remote/game-tester-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8f26cb3cc1a3b4e1',
      destination: '/offres/remote/executive-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6635228e94760fed',
      destination: '/offres/remote/mex-cajero-sucursal-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b6377ecff1712def',
      destination: '/offres/remote/graphic-designer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/67431dbf83fe2f40',
      destination: '/offres/remote/content-editor-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f16530abaf6fa387',
      destination: '/offres/remote/virtual-assistant-panelist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/904ddf63985cad23',
      destination: '/offres/remote/virtual-assistant-panelist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bd3de41ecdb1a1a2',
      destination: '/offres/remote/online-focus-group-panelist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/64a5426b3a51718f',
      destination: '/offres/remote/online-focus-group-panelist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5e5530f3374f9017',
      destination: '/offres/remote/online-focus-group-panelist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8b414ba83199d551',
      destination: '/offres/remote/it-support-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/06f7b0aa5022ca88',
      destination: '/offres/remote/executive-assistant-the-ceo-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5667429c76e292dc',
      destination: '/offres/remote/security-officer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e34b0969c1e8d13e',
      destination: '/offres/remote/profesores-de-espaaol-como-lengua-extranjera-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c2703e8ec1055b08',
      destination: '/offres/remote/profesores-de-ele-para-clases-particulares-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/09ae50026ab2782d',
      destination: '/offres/remote/profesor-y-tutor-para-apoyo-escolar-y-clases-particulares-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/677810c8dfbfed4d',
      destination: '/offres/remote/social-media-content-creator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/138f7a441af5eecc',
      destination: '/offres/remote/chief-operating-officer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7836c312ed2e2a0a',
      destination: '/offres/remote/chief-operating-officer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/87f40b2d0bf4adda',
      destination: '/offres/remote/civil-engineer-python-expert-freelance-ai-trainer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bd6a0cfbf4f2d330',
      destination: '/offres/remote/account-director-enterprise-sales-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1afeed42bab3ce94',
      destination: '/offres/remote/sr-manager-user-acquisition-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/521fd533fd9e40e9',
      destination: '/offres/remote/patent-attorney-us-qualified-freelance-ai-trainer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/730e4caf8e01e20c',
      destination: '/offres/remote/freelance-junior-designer-hearst-made-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/573a2d616fee5f8f',
      destination: '/offres/remote/senior-power-platform-software-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5d9524eb76310e39',
      destination: '/offres/remote/accounts-receivable-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4d195b4c6e276025',
      destination: '/offres/remote/senior-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/671cc782a1f4a772',
      destination: '/offres/remote/senior-backend-developer-rust-c-6-months-contract-open-to-extension-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/388a5a37e3789922',
      destination: '/offres/remote/freelance-legal-consultant-us-law-ai-trainer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3bf94a82b3f894b9',
      destination: '/offres/remote/computer-science-expert-with-python-experience-ai-projects-on-mindrift-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/722d5439c69a1337',
      destination: '/offres/remote/data-entry-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7339a3092ed33820',
      destination: '/offres/remote/administrative-assistant-support-talent-pool-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4a43b8291b75e8b2',
      destination: '/offres/remote/mathematical-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5cb78717bc957d2b',
      destination: '/offres/remote/technical-account-manager-encompass-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a8e883635c00d531',
      destination: '/offres/remote/civil-engineering-intern-summer-2026-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/96a27f63ed501e50',
      destination: '/offres/remote/solutions-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2017a20d11577208',
      destination: '/offres/remote/associate-data-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9354b8bd7af427b8',
      destination: '/offres/remote/director-product-management-certifications-and-compliance-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1dff4f279385cab2',
      destination: '/offres/remote/contracts-attorney-us-law-freelance-ai-trainer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e180f1868982cefa',
      destination: '/offres/remote/care-professional-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0de5077561383cda',
      destination: '/offres/remote/sr-manager-product-development-project-management-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/13866e9cb68e5cea',
      destination: '/offres/remote/fluent-english-ai-integration-specialist-czechia-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/119da9d63c0c8f32',
      destination: '/offres/remote/recruiter-contract-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aec339012046fb42',
      destination: '/offres/remote/software-engineering-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9b5f39cce1563962',
      destination: '/offres/remote/legal-professional-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a078bb299adf7203',
      destination: '/offres/remote/computer-science-expert-with-python-experience-ai-projects-on-mindrift-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/daf7cb35b1f20fa2',
      destination: '/offres/remote/senior-pharmacy-business-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/438320647f90101c',
      destination: '/offres/remote/payment-integrity-data-mining-ideation-sme-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3aaf5e7ed399d953',
      destination: '/offres/remote/patent-attorney-us-qualified-freelance-ai-trainer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0558227bb1bdb42c',
      destination: '/offres/remote/data-analyst-it-service-center-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0e7c30194df98761',
      destination: '/offres/remote/lead-technical-partner-enablement-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/34524bc7863a2927',
      destination: '/offres/remote/marketing-manager-gn-more-nutrition-schweiz-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3259ea7e9621fb57',
      destination: '/offres/remote/manager-customer-success-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4ff6280a2342303f',
      destination: '/offres/remote/ps-german-player-support-advocate-remote-full-time-and-part-time-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3f5cfedce2c9be81',
      destination: '/offres/remote/electrical-engineer-python-expert-freelance-ai-trainer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f01b095fc5211239',
      destination: '/offres/remote/freelancer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ccf92041dbb78c9c',
      destination: '/offres/remote/customer-care-and-sales-advisor-i-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f9072fbf3ea3fa69',
      destination: '/offres/remote/specialist-business-consulting-alt-ventures-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4bd96ff11fbccab0',
      destination: '/offres/remote/outbound-sales-development-representative-latin-america-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a9f0f8dbd40256b6',
      destination: '/offres/remote/clerk-typist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b54a13da92116519',
      destination: '/offres/remote/chat-support-clerk-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/05ddd2dd4fe0313d',
      destination: '/offres/remote/director-of-customer-support-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/13b23fc9180fd912',
      destination: '/offres/remote/research-physicist-with-python-experience-freelance-ai-trainer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/55868dd0aaf9b6fe',
      destination: '/offres/remote/credentialing-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c75e0d1eb69cc60f',
      destination: '/offres/remote/castilian-spanish-translation-localization-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4d6da286896efa16',
      destination: '/offres/remote/oracle-integration-cloud-oic-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/17237f4a5beebc80',
      destination: '/offres/remote/senior-backend-engineer-distributed-systems-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c4f18a21c839230c',
      destination: '/offres/remote/senior-product-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3b8b5a5f481acb5e',
      destination: '/offres/remote/agency-project-management-strategist-2026-election-cycle-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aec8d01278767460',
      destination: '/offres/remote/director-process-transformation-gbs-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f0a874848701dd78',
      destination: '/offres/remote/1075-qa-engineer-ai-agent-based-systems-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e18c28d75e1e8dbf',
      destination: '/offres/remote/sales-lead-management-specialist-job-id-kirmj1-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/09b050b7c33dd36f',
      destination: '/offres/remote/senior-epidemiologist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2e419b5dcdc93498',
      destination: '/offres/remote/senior-relationship-manager-enterpriseglobal-brands-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ab81806fda635908',
      destination: '/offres/remote/senior-statistical-programmer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1517fa749316f8dd',
      destination: '/offres/remote/customer-marketing-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f427a136c967b96d',
      destination: '/offres/remote/channel-sales-account-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0d1b0909d1042df3',
      destination: '/offres/remote/product-analyst-full-time-remote-latin-america-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/17ca2984fa12c864',
      destination: '/offres/remote/senior-manager-of-experiential-marketing-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c59824ba27c41822',
      destination: '/offres/remote/solutions-architect-enterprise-applications-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/33ab13acc3558212',
      destination: '/offres/remote/evercommerce-senior-data-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9a65308308f70d69',
      destination: '/offres/remote/mechanical-engineer-python-expert-freelance-ai-trainer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c260f9f032f944f5',
      destination: '/offres/remote/religion-specialist-freelance-ai-trainer-project-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/31dabb4aab176721',
      destination: '/offres/remote/mergers-acquisitions-account-manager-employee-benefits-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ae1a806420fe3835',
      destination: '/offres/remote/senior-revenue-intelligence-operations-manager-marketing-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ae1f25aafc46cada',
      destination: '/offres/remote/consultant-en-implantation-de-sage-intacct-bilingue-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/78ab384d28165bf9',
      destination: '/offres/remote/net-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c47b2b5866a37d51',
      destination: '/offres/remote/care-navigation-program-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c74b3d21ead35c06',
      destination: '/offres/remote/senior-product-owner-atlassian-platform-automation-sdlcnext-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2f1bd6302534214b',
      destination: '/offres/remote/automotive-account-executive-oem-sales-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/20eb268a1b5fdbed',
      destination: '/offres/remote/manager-managed-account-services-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9d4801e8e623a326',
      destination: '/offres/remote/mid-market-account-executive-dmv-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d25d31aea103cae3',
      destination: '/offres/remote/jefe-de-calidad-procesos-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2c5038eb0b2b1d6b',
      destination: '/offres/remote/ai-endpoint-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/dc5791b3ba774099',
      destination: '/offres/remote/staff-software-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/fd9381288e129a44',
      destination: '/offres/remote/corporate-social-responsibility-coordinator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8917e2def76c8253',
      destination: '/offres/remote/senior-denials-prevention-process-improvement-advisor-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/517081f93daf7ff6',
      destination: '/offres/remote/procurement-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3e1108f09cea078c',
      destination: '/offres/remote/email-marketing-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0f77d44e7f4dd8a9',
      destination: '/offres/remote/senior-account-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e2162ef55bf20800',
      destination: '/offres/remote/quantum-research-scientist-with-python-freelance-ai-trainer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5005bfe370d3c6d6',
      destination: '/offres/remote/project-manager-datacenter-all-gender-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/12852de3f442de74',
      destination: '/offres/remote/architect-solutions-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3785eeeb66affeb2',
      destination: '/offres/remote/materials-engineer-python-expert-freelance-ai-trainer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/63944e5238642e0a',
      destination: '/offres/remote/senior-implementation-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5b56e58d0094a719',
      destination: '/offres/remote/talent-acquisition-partner-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ad238b2d6ba5849d',
      destination: '/offres/remote/ai-systems-engineering-subject-matter-expert-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5e5fff767f61bc1e',
      destination: '/offres/remote/psiquiatra-teleconsulta-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/964b9a8024e5ab8d',
      destination: '/offres/remote/sales-development-representative-spain-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aaab5f17ccde4f37',
      destination: '/offres/remote/ios-engineer-ii-ai-native-family-ai-lab-san-francisco-bay-area-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3fa1a70c0de2f08f',
      destination: '/offres/remote/occupational-safety-and-health-data-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0f4a0d743af29098',
      destination: '/offres/remote/customer-success-manager-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f7270adb242ea9f2',
      destination: '/offres/remote/technical-support-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/01183f232f563885',
      destination: '/offres/remote/software-engineer-ii-l2-integrations-team-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3896422342c92bbd',
      destination: '/offres/remote/associate-emea-marketing-manager-mfd-ideally-based-in-italy-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/79552cc88848ed97',
      destination: '/offres/remote/senior-clinical-research-associate-sponsor-dedicated-oncology-experience-nee-rem',
      permanent: true,
    },
    {
      source: '/offres/remote/9905061e6457ba44',
      destination: '/offres/remote/senior-portfolio-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/cdd02f277c90cb6d',
      destination: '/offres/remote/middle-school-electives-teacher-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/99878be0feea3c72',
      destination: '/offres/remote/staff-sw-engineer-machine-learning-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/fcb6a529b0069f5f',
      destination: '/offres/remote/supervisor-driver-compliance-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5e4129c8e83920b2',
      destination: '/offres/remote/devops-engineer-duck-creek-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b1d6781ae5dd20d4',
      destination: '/offres/remote/call-center-member-contact-center-rep-1-full-time-remote-ak-az-nv-tx-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c10ced5bd93dcdb0',
      destination: '/offres/remote/sales-representative-truck-tires-belux-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/59140b77155215a5',
      destination: '/offres/remote/principal-software-engineer-ai-platform-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/43e94aaa218ebbeb',
      destination: '/offres/remote/mortgage-loan-closer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/de642dd4cce45ee3',
      destination: '/offres/remote/gateway-agent-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8e9cd6aabdf761c3',
      destination: '/offres/remote/operations-agent-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d975cce36f01418a',
      destination: '/offres/remote/pessoa-desenvolvedora-c-c-embarcado-pl-meios-de-pagamento-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/57a49b4ef9416831',
      destination: '/offres/remote/atendente-de-sac-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f3501db00308903a',
      destination: '/offres/remote/genetic-counseling-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b25d1dded3dc3280',
      destination: '/offres/remote/junior-brand-designer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/87321c0e9014cfdd',
      destination: '/offres/remote/claims-officer-nassau-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e8d38e7617d0bfbf',
      destination: '/offres/remote/customer-service-representative-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bbf3c852f0ef47fe',
      destination: '/offres/remote/online-focus-group-panelist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0cfdf5f0b53f836d',
      destination: '/offres/remote/online-focus-group-panelist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7e3e4fd7c3ce6049',
      destination: '/offres/remote/virtual-assistant-panelist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e51a88c7c47edd78',
      destination: '/offres/remote/online-focus-group-panelist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/00cb72f7eee7a2d8',
      destination: '/offres/remote/virtual-assistant-panelist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7146af653870f49a',
      destination: '/offres/remote/staff-writer-health-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5ea98c65ae7ed326',
      destination: '/offres/remote/asesor-comercial-paraguay-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/82a572dd30ac9f20',
      destination: '/offres/remote/tst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4128268376326707',
      destination: '/offres/remote/multi-jurisdiction-accountant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c720dfd4657303e2',
      destination: '/offres/remote/cruise-resort-reservation-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c71e6c05a034e252',
      destination: '/offres/remote/a-variety-of-roles-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/05672e54ec979e96',
      destination: '/offres/remote/fraud-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b78029a88d3d4b82',
      destination: '/offres/remote/appetiser-junior-full-stack-developer-laravel-and-vuejs-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/306fc1fdb62f18cc',
      destination: '/offres/remote/viseven-product-marketing-manager-b2b-for-life-sciencespharmabiotech-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d899575b50fa6962',
      destination: '/offres/remote/centralreach-director-ai-product-development-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f74219ab12a2b30a',
      destination: '/offres/remote/knowmad-mood-senior-devops-engineer-migraciones-cicd-remoto-100-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1c7785337992cd96',
      destination: '/offres/remote/iungo-spa-product-owner-mf-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/07cb9f679b7bae24',
      destination: '/offres/remote/e-breuninger-co-product-owner-zendesk-customer-service-mwd-remote-moglich-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/50dc98f3aebad0c8',
      destination: '/offres/remote/aledade-senior-product-analyst-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/481468c8142a1662',
      destination: '/offres/remote/welocalize-product-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1500d4d94faf5124',
      destination: '/offres/remote/operations-staff-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e342d8f7ae39a8a3',
      destination: '/offres/remote/finance-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/548babed983da8ec',
      destination: '/offres/remote/care-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/08fe2f2522324485',
      destination: '/offres/remote/postperson-with-driving-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0493f4d0875a2f2e',
      destination: '/offres/remote/asistente-acadamico-de-educacian-continua-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3292677e69355a9b',
      destination: '/offres/remote/facilities-maintenance-technician-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ac043b91b5c476f5',
      destination: '/offres/remote/director-of-operations-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7e8b0ebfea8c8752',
      destination: '/offres/remote/open-role-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f231a63b236f8c6b',
      destination: '/offres/remote/toptal-ai-engineerpython-develope-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/be12709461f4ff90',
      destination: '/offres/remote/profesor-a-online-para-refuerzo-escolar-y-preparacian-de-examenes-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a99a634245ff682e',
      destination: '/offres/remote/housekeeper-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3724f6326b333720',
      destination: '/offres/remote/2d-artist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3e15e2ba35321ff1',
      destination: '/offres/remote/monitor-operacional-cachoeirinha-rs-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/56f1d4701bb24711',
      destination: '/offres/remote/district-associate-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2aa5a2874e7f910e',
      destination: '/offres/remote/printing-press-feeder-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c572cdb7e7253264',
      destination: '/offres/remote/cleaners-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/fb7ae72f70bd93c7',
      destination: '/offres/remote/parts-picker-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/community-manager-full-remote-maroc',
      destination: '/offres/remote/community-manager-full-remote-maroc-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/051e2d3109db8ab7',
      destination: '/offres/remote/asset-protection-specialist-burnaby-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9e642c77355f6f2c',
      destination: '/offres/remote/agente-de-recrutamento-e-seleaao-remoto-diarista-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1e2327a0f51350e5',
      destination: '/offres/remote/corporate-counsel-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/177f48467cd06a69',
      destination: '/offres/remote/personal-financial-counselor-assignment-ready-counselor-pfc-north-dakota-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0045fc0b52a2d340',
      destination: '/offres/remote/regional-sales-manager-remote-united-states-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f6b7287df00bcf69',
      destination: '/offres/remote/wireless-engineer-mdu-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d9910e07b27ac6db',
      destination: '/offres/remote/enterprise-architect-solution-executive-large-deals-us-remote-plano-tx-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7a3f5e87f35ecd61',
      destination: '/offres/remote/contract-opportunity-technical-marketing-copywriter-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1b525d80e04aa740',
      destination: '/offres/remote/senior-ai-engineer-all-genders-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b7c7bab05aac8409',
      destination: '/offres/remote/medical-policy-coding-support-coordinator-cpccpc-a-preferred-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7c686462af3373e8',
      destination: '/offres/remote/manager-aerospace-and-defense-marketing-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f6a0bcf413f18628',
      destination: '/offres/remote/seo-account-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b8ecb470ced77601',
      destination: '/offres/remote/sr-product-manager-oracle-finance-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5e6fd4ceb63745be',
      destination: '/offres/remote/product-designer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/518318cf0db58e87',
      destination: '/offres/remote/global-sales-transformation-professional-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/250ed621e54839ae',
      destination: '/offres/remote/job-29480-senior-data-architect-brazil-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c11e680a6d66eb41',
      destination: '/offres/remote/staff-rdproduct-dvl-engineer-signal-integrity-middletown-pa-us-17057-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aad05bf3b77240a4',
      destination: '/offres/remote/associate-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/191b2849f0fe01f3',
      destination: '/offres/remote/director-field-marketing-japac-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b520a6f4e929a93f',
      destination: '/offres/remote/sap-integration-suite-cpi-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/42ec4046dc9ea1a5',
      destination: '/offres/remote/national-account-sales-manager-ii-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/886b7ca9f97925f0',
      destination: '/offres/remote/devops-engineer-wfh-benefits-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d54d18a62d7577ef',
      destination: '/offres/remote/customer-project-lead-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4f205f8e784adf09',
      destination: '/offres/remote/python-engineering-manager-commercial-systems-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7ae6a01deceb0ad5',
      destination: '/offres/remote/softwaredata-engineer-aws-python-remote-full-time-is008-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7121d05bbcbaec32',
      destination: '/offres/remote/senior-product-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/31d036409139617c',
      destination: '/offres/remote/net-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6ae37d344a4de992',
      destination: '/offres/remote/fluent-english-technical-support-consultant-remote-europe-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/730188c2b282ec20',
      destination: '/offres/remote/director-data-engineering-cloud-data-platforms-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/575133bcfce105bc',
      destination: '/offres/remote/mechanical-engineer-power-systems-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/165ea2cfd3dc0c42',
      destination: '/offres/remote/services-sales-solution-architect-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a36c309440efd89f',
      destination: '/offres/remote/senior-software-engineer-trading-infrastructure-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f56e627917af63ef',
      destination: '/offres/remote/content-marketing-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b6ad8ee049656451',
      destination: '/offres/remote/python-developer-brazil-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d379579d1b4d2e87',
      destination: '/offres/remote/nutricionista-y-o-nutrialoga-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6d28105f175076a4',
      destination: '/offres/remote/proofreader-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1773b261ba5ae319',
      destination: '/offres/remote/coder-auditor-professional-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0c06e8248cf639c1',
      destination: '/offres/remote/director-data-enterprise-architecture-transformation-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d7a35db2ca4157e3',
      destination: '/offres/remote/analytics-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7b282e8b8a1091ff',
      destination: '/offres/remote/iam-cloud-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/063f4b9ec800a768',
      destination: '/offres/remote/e-mail-marketing-specialist-mwd-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0574309717a2b5c4',
      destination: '/offres/remote/gif-animator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9d54d034b3a77772',
      destination: '/offres/remote/senior-backend-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/164ba3e744a9a2e9',
      destination: '/offres/remote/program-support-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bd84a88a62413a69',
      destination: '/offres/remote/customer-experience-specialist-1-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/21f97b45d3fbaaed',
      destination: '/offres/remote/director-lifecycle-marketing-crm-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f9ac309ea050a1ba',
      destination: '/offres/remote/bilingual-sales-representative-german-english-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/55b647443fab19b7',
      destination: '/offres/remote/foia-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/73cc843a117963e1',
      destination: '/offres/remote/hiring-for-automation-architect-rpa-c2c-remote-15-years-of-exp-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e23a392690b42b9d',
      destination: '/offres/remote/senior-developer-advocate-video-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0f5200e45b060dfa',
      destination: '/offres/remote/market-development-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d030a519560f5ca7',
      destination: '/offres/remote/servicenow-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/40f04657c1d5d571',
      destination: '/offres/remote/senior-project-manager-remote-contract-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d3ddbf5ca3a901e5',
      destination: '/offres/remote/java-engineer-application-database-modernization-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8c1691acd045364b',
      destination: '/offres/remote/vice-president-business-transformation-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/147f59e33077e478',
      destination: '/offres/remote/technical-service-representative-construction-job-home-based-home-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/69fe4159071405b1',
      destination: '/offres/remote/senior-lead-auditor-dach-mwd-schwerpunkt-tisax-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0bc954820f212156',
      destination: '/offres/remote/global-customer-operations-team-lead-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/21b820eb93ed8ebe',
      destination: '/offres/remote/ai-tutor-video-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7b535bc6d4852311',
      destination: '/offres/remote/mobile-lvnlpn-per-diem-in-home-services-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/79338baba2ce42ae',
      destination: '/offres/remote/graphic-designer-latin-america-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5a3a62bf95ded8a4',
      destination: '/offres/remote/specialist-recruiter-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/270c96ceff7c215a',
      destination: '/offres/remote/pennhip-dvm-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/21a6b912e6c3a9ce',
      destination: '/offres/remote/executive-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f61b9da7cd6b523e',
      destination: '/offres/remote/marine-field-service-technician-iii-econtrols-remote-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/38ce7308133db559',
      destination: '/offres/remote/senior-account-based-marketing-gtm-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/69ae0b18919eff71',
      destination: '/offres/remote/business-development-manager-vollzeit-mwd-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c260f6d92c48b96b',
      destination: '/offres/remote/manual-quality-assurance-engineer-simba-team-novi-sad-serbia-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f86622076a9f44cb',
      destination: '/offres/remote/scm-technical-consultant-dita-architect-freelance-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/42077f0b79c5bace',
      destination: '/offres/remote/junior-ubuntu-software-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/72686c46eed829a8',
      destination: '/offres/remote/register-your-interest-for-future-apprenticeships-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6b56c4cc3ac5015f',
      destination: '/offres/remote/sales-development-representative-work-from-home-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9b04721981a589e1',
      destination: '/offres/remote/sap-abap-developer-s4hana-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/605d88fa65d44ab8',
      destination: '/offres/remote/soc-analyst-gurugram-gurgaon-hr-in-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a8e75eb788c5feb2',
      destination: '/offres/remote/virtual-gp-vic-au-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/47caa6c7560fc071',
      destination: '/offres/remote/auditor-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ea07aac12c800179',
      destination: '/offres/remote/netsuite-senior-support-consultant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/53e4235e0007dd39',
      destination: '/offres/remote/middle-net-developer-for-events-center-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/80e01b8d4a60d883',
      destination: '/offres/remote/sr-staff-software-engineer-developer-productivity-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/55c00c84658991c5',
      destination: '/offres/remote/staff-forecasting-data-scientist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/54d84cc5bdc30a3e',
      destination: '/offres/remote/oracle-erp-principal-presales-solutions-architect-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d12a8ceb8cc79f11',
      destination: '/offres/remote/team-lead-technical-implementations-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/68ccdd831b6c8755',
      destination: '/offres/remote/integration-engineer-emr-connectivity-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3e094c919366f7a3',
      destination: '/offres/remote/manual-quality-assurance-engineer-simba-team-bangalore-india-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/256e324fae38f5f9',
      destination: '/offres/remote/senior-advertising-manager-paid-media-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/469a5f17c6355c1d',
      destination: '/offres/remote/sales-consultant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/694af179c14ac350',
      destination: '/offres/remote/technical-resource-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5aba9bf4f16aa3ba',
      destination: '/offres/remote/staff-software-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/49c1c116d288766e',
      destination: '/offres/remote/infrastructure-network-sme-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/df421d966982c04e',
      destination: '/offres/remote/813-senior-javascript-developer-short-term-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/bd69d67bdd373e9b',
      destination: '/offres/remote/director-of-sales-europe-middle-east-africa-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2a24da406a60427c',
      destination: '/offres/remote/retirement-calculation-verification-specialist-100-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0b0ba3370172830d',
      destination: '/offres/remote/pre-sales-solution-architect-aws-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e33f51183a31c2a2',
      destination: '/offres/remote/sr-clinical-marketing-manager-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f0ed648a6013aac5',
      destination: '/offres/remote/senior-software-engineer-payer-engineering-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/65760886b34ac4bc',
      destination: '/offres/remote/account-executive-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5a4084952a275c55',
      destination: '/offres/remote/part-time-sourcer-market-researcher-part-time-contract-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d77e55c869021c07',
      destination: '/offres/remote/head-of-emc-regional-product-management-emea-remote-mfd-bw-de-73099-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/12d5695869697583',
      destination: '/offres/remote/underwriter-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3a83f44e47e3b53e',
      destination: '/offres/remote/head-of-paid-acquisition-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/2f7e307fc4c4c7f3',
      destination: '/offres/remote/backend-developer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/99b4cdf9a254c40e',
      destination: '/offres/remote/remote-overnight-radiology-physician-winston-salem-nc-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/44515760c3e7131a',
      destination: '/offres/remote/staff-backend-engineer-adaptive-telemetry-germany-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1b51b22cd9315911',
      destination: '/offres/remote/senior-servicenow-consultant-itom-cmdb-platform-consulting-mwd-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/555a7817758c2808',
      destination: '/offres/remote/operational-excellence-readiness-coach-bilingual-spanishenglish-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6538c798d9b9fe4f',
      destination: '/offres/remote/account-executive-mwd-energy-utilities-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c3bd48d073ea5140',
      destination: '/offres/remote/territory-sales-officer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9ec93c556b8e6e6e',
      destination: '/offres/remote/website-product-owner-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ffbe8da367fea01a',
      destination: '/offres/remote/operations-analyst-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6d86a647d5669cae',
      destination: '/offres/remote/online-hotel-booker-no-experience-needed-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/8913d62f8071ab2a',
      destination: '/offres/remote/online-booking-reservations-assistant-no-experience-needed-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1624dd8019113792',
      destination: '/offres/remote/online-booking-reservations-assistant-no-experience-needed-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aec4cd7f59553368',
      destination: '/offres/remote/dibujante-tacnico-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/cb50d5eec2734bb3',
      destination: '/offres/remote/general-production-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/91296e8cb452d376',
      destination: '/offres/remote/general-production-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1ea8ee71dc734373',
      destination: '/offres/remote/booking-reservations-coordinator-training-provided-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/343aeef63f2c480e',
      destination: '/offres/remote/loss-prevention-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/02851c5b535ad294',
      destination: '/offres/remote/head-of-operations-overtimeai-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3957d63ce2fd2a65',
      destination: '/offres/remote/online-entry-level-scheduling-coordinator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/b93153921a2241b5',
      destination: '/offres/remote/conta-azul-banco-de-talentos-pessoas-com-deficiencia-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/28c328c01b248913',
      destination: '/offres/remote/fis-capital-markets-product-manager-fraud-solutions-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/350863e382e08bb9',
      destination: '/offres/remote/cashme-desenvolvedor-dynamics-365-ce-100-remota-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/53954a16a28e8967',
      destination: '/offres/remote/ey-operations-manager-germany-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/67d7c9d82460b3cf',
      destination: '/offres/remote/cohesity-senior-manager-finance-strategy-planning-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c391ab1c776f6965',
      destination: '/offres/remote/rock-encantech-senior-fullstack-engineer-produtos-financeiros-miniapps-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e8326d4019e31378',
      destination: '/offres/remote/cora-pessoa-desenvolvedora-backend-senior-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/12095e3362eb60a8',
      destination: '/offres/remote/alkami-director-go-to-market-financial-planning-analysis-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1f3749c7bcf2eaf1',
      destination: '/offres/remote/milwaukee-tool-director-finance-fa-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e0a5129d08b5a639',
      destination: '/offres/remote/tcwglobal-financial-analyst-fpa-degrees-copy-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aacae2703419cde1',
      destination: '/offres/remote/analista-pleno-de-negacios-offshore-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0dc4572f3719858b',
      destination: '/offres/remote/expeditor-abbotsford-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0e94e2fa2f5b3977',
      destination: '/offres/remote/executivo-de-contas-de-fitas-e-adesivos-industriais-rio-de-janeiro-e-esparito-sa',
      permanent: true,
    },
    {
      source: '/offres/remote/d1864374b169426d',
      destination: '/offres/remote/paralegal-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/53bc6e715f1fd737',
      destination: '/offres/remote/workada-data-labeling-specialist-remote-contract-work-18-22-per-hour-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/32df704d0e87c9de',
      destination: '/offres/remote/online-hotel-resort-coordination-specialist-entry-level-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c26f3e88d02398f4',
      destination: '/offres/remote/booking-coordinator-no-experience-needed-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/80b2d920b29085cc',
      destination: '/offres/remote/online-customer-care-coordinator-entry-level-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3a806d6e3ca161fa',
      destination: '/offres/remote/customer-service-reservations-associate-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/14063f10ddfc445d',
      destination: '/offres/remote/radix-profissional-web-designer-senior-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/91ba01c4d6a0b929',
      destination: '/offres/remote/vinta-senior-product-manager-remote-135-183k-clt-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/027789ced634dcc7',
      destination: '/offres/remote/luxury-presence-staff-software-engineer-ai-website-builder-us-remote-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7b2d470eadd255e0',
      destination: '/offres/remote/cubos-tecnologia-cubos-devops-pessoa-engenheira-de-devops-pleno-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5a92ae2ebbc30eff',
      destination: '/offres/remote/radix-profissional-iac-devops-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/3ab2eae44bf82f43',
      destination: '/offres/remote/cubos-tecnologia-banco-de-talentos-product-manager-pleno-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0226d3961bf4ba11',
      destination: '/offres/remote/cubos-tecnologia-banco-de-talentos-product-manager-jr-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/ccc1b138dc3af4d3',
      destination: '/offres/remote/alice-devops-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/222bcb309f8f1598',
      destination: '/offres/remote/analyst-accounts-payable-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/778ee1b030561210',
      destination: '/offres/remote/nabu-global-fze-creative-performance-designer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0f79c32951dbdb09',
      destination: '/offres/remote/cleaner-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/f76249d0e3d2d1a2',
      destination: '/offres/remote/compliance-and-safety-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/aaca5f379c923f72',
      destination: '/offres/remote/campos-property-solutions-lead-manager-for-real-estate-investment-company-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5cbd58cfe1b8ce3d',
      destination: '/offres/remote/level-1-help-desk-technician-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/59ee1dcfee43c515',
      destination: '/offres/remote/lawnstarter-staff-product-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/c2c0557e72a1ae36',
      destination: '/offres/remote/guest-service-agent-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/4a1bb3dfef37db76',
      destination: '/offres/remote/entry-level-administrative-assistant-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/85aea43c16580164',
      destination: '/offres/remote/janitor-engineer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a125b8772bb28684',
      destination: '/offres/remote/baker-with-benefits-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/0ce4f518d2804ba5',
      destination: '/offres/remote/aiaeea-caecicai-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a4bee5b76fd862dc',
      destination: '/offres/remote/chief-medical-scribe-upto-80-hr-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d88ff3702503bd48',
      destination: '/offres/remote/pediatric-registered-nurse-upto-65-hr-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/fe8f0eae5642b6a1',
      destination: '/offres/remote/special-projects-lead-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/db3e203180e1a512',
      destination: '/offres/remote/care-manager-1-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/349237f612e3a864',
      destination: '/offres/remote/chief-technology-officer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/be328147446eb716',
      destination: '/offres/remote/suporte-tacnico-de-suporte-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/7fcae7a031643fdd',
      destination: '/offres/remote/veterans-application-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/6f519e3b26ddb7bf',
      destination: '/offres/remote/social-media-coordinator-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/90fbe7f590ec999d',
      destination: '/offres/remote/online-service-hotel-booking-specialist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/d1cbf1810729c788',
      destination: '/offres/remote/productor-a-de-vadeo-enmo-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1a3b323ed4df626e',
      destination: '/offres/remote/handyman-woman-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/1c691acbe8e8dc79',
      destination: '/offres/remote/arborist-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/5a7c5fb3d5d1ae78',
      destination: '/offres/remote/lawnstarter-senior-webflow-designer-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/e3c763f26048fac0',
      destination: '/offres/remote/pse-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/a51ec13caad4d7b3',
      destination: '/offres/remote/shiftforce-llc-full-stack-developer-net-react-azure-remote-us-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/868a0ed420f4353e',
      destination: '/offres/remote/orchard-brokerage-jr-appointment-setter-remote',
      permanent: true,
    },
    {
      source: '/offres/remote/9b6a6aa33f82d749',
      destination: '/offres/remote/nogigiddy-entry-level-account-manager-remote',
      permanent: true,
    },
      // non-www → www (301 permanent)
      {
        source: "/:path*",
        has: [{ type: "host", value: "interactjob.ma" }],
        destination: "https://www.interactjob.ma/:path*",
        permanent: true,
      },
      // Old singular /offre/:slug → /offres/:slug
      {
        source: "/offre/:slug",
        destination: "/offres/:slug",
        permanent: true,
      },
      // Old /emploi/* and /jobs/* patterns → /offres
      {
        source: "/emploi/:path*",
        destination: "/offres",
        permanent: true,
      },
      {
        source: "/jobs/:path*",
        destination: "/offres",
        permanent: true,
      },
      {
        source: "/job/:path*",
        destination: "/offres",
        permanent: true,
      },
      // Old /article/* → /blog
      {
        source: "/article/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      // /fr/* → /* (fr is default locale, no prefix needed)
      {
        source: "/fr/:path*",
        destination: "/:path*",
        permanent: true,
      },
      // LinkedIn-shared URLs where enricher regenerated the slug after sharing
      {
        source: "/offres/asd-ma-tassil-wa-tatabbou-talab-addam-alijtimaii-almubachir",
        destination: "/offres/asdma-maroc",
        permanent: true,
      },
      // /teletravail → /offres/remote
      {
        source: "/teletravail",
        destination: "/offres/remote",
        permanent: true,
      },
      // /en/postuler → /en/apply  (English canonical is /apply)
      {
        source: "/en/postuler",
        destination: "/en/apply",
        permanent: true,
      },
      // /apply (no locale) → /postuler  (French default)
      {
        source: "/apply",
        destination: "/postuler",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
