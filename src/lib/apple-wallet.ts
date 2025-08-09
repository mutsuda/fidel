export interface AppleWalletConfig {
  teamId: string;
  passTypeId: string;
  passCertificatePath?: string;
  passCertificatePassword?: string;
  webServiceCertificatePath?: string;
  webServiceCertificatePassword?: string;
}

export interface CardData {
  id: string;
  hash: string;
  code: string;
  type: 'FIDELITY' | 'PREPAID';
  customerName: string;
  customerEmail?: string;
  currentUses?: number;
  totalUses?: number;
  remainingUses?: number;
  initialUses?: number;
  active: boolean;
  createdAt: string;
  businessName?: string;
  businessLogo?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  labelColor?: string;
}

export class AppleWalletService {
  private config: AppleWalletConfig;

  constructor(config: AppleWalletConfig) {
    this.config = config;
  }

  async generatePassWithoutCertificates(cardData: CardData): Promise<Buffer> {
    // Método temporal para generar estructura PKPass sin certificados
    // Esto permite ver la estructura mientras se crean los certificados
    
    const passStructure = {
      formatVersion: 1,
      passTypeIdentifier: this.config.passTypeId,
      teamIdentifier: this.config.teamId,
      organizationName: cardData.businessName || 'Shokupan',
      description: `Tarjeta de ${cardData.type.toLowerCase()} para ${cardData.customerName}`,
      serialNumber: cardData.hash,
      generic: {
        primaryFields: [
          {
            key: 'balance',
            label: cardData.type === 'FIDELITY' ? 'Progreso' : 'Usos',
            value: cardData.type === 'FIDELITY' 
              ? `${cardData.currentUses || 0}/${cardData.totalUses || 10}`
              : `${cardData.remainingUses || 0}/${cardData.initialUses || 10}`
          }
        ],
        secondaryFields: [
          {
            key: 'type',
            label: 'Tipo',
            value: cardData.type === 'FIDELITY' ? 'Fidelidad' : 'Prepago'
          },
          {
            key: 'customer',
            label: 'Cliente',
            value: cardData.customerName
          }
        ],
        auxiliaryFields: [
          {
            key: 'status',
            label: 'Estado',
            value: cardData.active ? 'Activa' : 'Inactiva'
          },
          {
            key: 'created',
            label: 'Creada',
            value: new Date(cardData.createdAt).toLocaleDateString('es-ES')
          }
        ]
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: cardData.hash,
          messageEncoding: 'iso-8859-1'
        }
      ],
      backgroundColor: cardData.backgroundColor || 'rgb(227, 242, 253)',
      foregroundColor: cardData.foregroundColor || 'rgb(0, 0, 0)',
      labelColor: cardData.labelColor || 'rgb(25, 118, 210)',
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
      voided: !cardData.active
    };

    // Por ahora, devolvemos la estructura como JSON
    // En el futuro, esto se convertirá en un archivo .pkpass válido
    const jsonString = JSON.stringify(passStructure, null, 2);
    return Buffer.from(jsonString, 'utf-8');
  }

  async generatePass(cardData: CardData): Promise<Buffer> {
    // Por ahora, usamos el método sin certificados
    // Cuando tengas los certificados, esto se actualizará
    return this.generatePassWithoutCertificates(cardData);
  }
}

// Instancia global del servicio
let appleWalletService: AppleWalletService | null = null;

export function getAppleWalletService(): AppleWalletService {
  if (!appleWalletService) {
    appleWalletService = new AppleWalletService({
      teamId: process.env.APPLE_TEAM_ID || 'K3GTNQT3FS',
      passTypeId: process.env.APPLE_PASS_TYPE_ID || 'pass.com.shokupan.loyalty',
      passCertificatePath: process.env.APPLE_PASS_CERTIFICATE_PATH,
      passCertificatePassword: process.env.APPLE_PASS_CERTIFICATE_PASSWORD,
      webServiceCertificatePath: process.env.APPLE_WEB_SERVICE_CERTIFICATE_PATH,
      webServiceCertificatePassword: process.env.APPLE_WEB_SERVICE_CERTIFICATE_PASSWORD
    });
  }
  return appleWalletService;
} 