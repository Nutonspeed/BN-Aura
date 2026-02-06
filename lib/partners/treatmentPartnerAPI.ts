/**
 * Treatment Partner API Integration System
 */

interface MedicalSupplier {
  supplierId: string;
  companyName: string;
  type: string;
  products: SupplierProduct[];
  minimumOrder: number;
  discountTier: string;
}

interface SupplierProduct {
  productId: string;
  productName: string;
  price: number;
  minimumOrderQty: number;
  inStock: boolean;
}

interface ClinicReferral {
  referralId: string;
  fromClinicId: string;
  toClinicId: string;
  customerId: string;
  referralType: string;
  referralFee: number;
  status: string;
}

interface EquipmentPartner {
  partnerId: string;
  companyName: string;
  equipmentTypes: string[];
  services: string[];
  responseTime: string;
  pricing: Record<string, number>;
}

class TreatmentPartnerAPI {
  private static suppliers: Map<string, MedicalSupplier> = new Map();
  private static referrals: Map<string, ClinicReferral> = new Map();
  private static equipmentPartners: Map<string, EquipmentPartner> = new Map();

  static registerSupplier(supplierData: any): MedicalSupplier {
    const supplierId = `supp_${Date.now()}`;
    const supplier: MedicalSupplier = { ...supplierData, supplierId };
    this.suppliers.set(supplierId, supplier);
    return supplier;
  }

  static createProductOrder(clinicId: string, supplierId: string, items: any[]): any {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const orderId = `order_${Date.now()}`;
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      orderId,
      supplier: supplier.companyName,
      totalAmount,
      status: 'pending'
    };
  }

  static createReferral(fromClinicId: string, toClinicId: string, customerId: string, referralData: any): ClinicReferral {
    const referralId = `ref_${Date.now()}`;
    const referralFee = referralData.type === 'specialty_treatment' ? 2000 : 1000;

    const referral: ClinicReferral = {
      referralId,
      fromClinicId,
      toClinicId,
      customerId,
      referralType: referralData.type,
      referralFee,
      status: 'pending'
    };

    this.referrals.set(referralId, referral);
    return referral;
  }

  static requestEquipmentService(clinicId: string, partnerId: string, serviceType: string): any {
    const partner = this.equipmentPartners.get(partnerId);
    if (!partner) throw new Error('Partner not found');

    const serviceRequestId = `service_${Date.now()}`;
    const estimatedCost = serviceType === 'emergency' ? 8000 : 3000;

    return {
      serviceRequestId,
      partner: partner.companyName,
      estimatedCost,
      responseTime: partner.responseTime
    };
  }

  static getPartnerAnalytics(clinicId: string): any {
    return {
      totalSuppliers: this.suppliers.size,
      totalReferrals: this.referrals.size,
      totalSpend: 125000,
      topPartners: ['MedSkin Professional', 'Laser Tech Solutions']
    };
  }
}

export { TreatmentPartnerAPI, type MedicalSupplier, type ClinicReferral };
