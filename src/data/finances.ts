// src/data/finances.ts
import { Timestamp } from "firebase/firestore";

/**
 * Represents a single purchase of raw materials or components.
 * Corresponds to the 'rawMaterialPurchases' collection.
 */
export interface RawMaterialPurchase {
  id: string; // Firestore document ID (e.g., RMP_CHEM_A_20250515)
  purchaseId: string; // User-defined or system-generated purchase identifier
  itemName: string;
  supplierId?: string;
  purchaseDate: Timestamp; // Date of purchase
  quantityPurchased: number;
  unitOfMeasure: string; // e.g., "Liter", "Kg", "Piece"
  unitCostPaid: number; // Cost per unitOfMeasure in EGP
  totalCostPaid: number; // quantityPurchased * unitCostPaid
  inboundShippingCostForItem?: number; // Specific shipping cost for this item/purchase
  notes?: string;
  invoiceUrl?: string; // Link to the invoice in Firebase Storage or elsewhere
}

/**
 * Details of a specific raw material used within a manufacturing batch.
 * This will be part of an array in the ManufacturingBatch interface.
 */
export interface RawMaterialUsageDetail {
  materialName: string;
  purchaseIdRef: string; // Reference to the document ID in 'rawMaterialPurchases'
  quantityUsed: number; // e.g., Liters, Kg
  unitOfMeasure: string; // Should match the unit from RawMaterialPurchase for consistency
  costForThisMaterialInBatch: number; // Calculated cost for the quantity used in this batch
}

/**
 * Details of components like bottles and labels used in a manufacturing batch.
 */
export interface ComponentUsageDetail {
  bottlesUsed: number;
  costPerBottleForThisBatch: number; // Includes base cost + allocated inbound shipping
  totalBottleCostForBatch: number;
  labelsUsed: number;
  costPerLabelForThisBatch: number; // Includes base cost + allocated inbound shipping
  totalLabelCostForBatch: number;
}

/**
 * Represents a single manufacturing/assembly batch for a specific product.
 * Corresponds to the 'manufacturingBatches' collection.
 */
export interface ManufacturingBatch {
  id: string; // Firestore document ID (e.g., PESTX_20250518_001)
  batchId: string; // User-defined or system-generated batch identifier
  productId: string; // Links to products_public and products_internal
  productName?: string; // For easier reference/display
  dateManufactured: Timestamp;
  rawMaterialsUsed: RawMaterialUsageDetail[];
  componentDetails: ComponentUsageDetail;
  inboundShippingAllocatedToBatch?: number; // Overall inbound shipping for batch if not allocated per item
  directLaborHours?: number;
  directLaborCostForBatch?: number;
  consumablesCostForBatch?: number; // e.g., cleaning supplies, filters
  unitsProduced_50ml: number; // Total 50ml bottles successfully manufactured
  totalBatchProductionCost: number; // Sum of all costs for this batch
  costPerUnitProducedInBatch: number; // totalBatchProductionCost / unitsProduced_50ml
  notes?: string;
  // Potentially add:
  // createdBy?: string; // User ID of who entered this batch
  // createdAt?: Timestamp;
}

/**
 * Stores internal (non-public) cost information for a product.
 * Corresponds to the 'products_internal' collection.
 * Document ID should match the product's public ID.
 */
export interface ProductInternal {
  id: string; // Firestore document ID (should be the same as products_public.id)
  currentAverageCOGS_50ml?: number; // A running average or weighted average COGS
  lastBatchCOGS_50ml?: number; // COGS from the most recent manufacturing batch
  accessoryKitCost?: number; // Cost of dilution bottle, sprayer, syringe if applicable
  lastCostUpdate?: Timestamp; // When these costs were last updated
  notesOnCosting?: string;
  // Historical COGS data could be an array if needed:
  // cogsHistory?: Array<{ date: Timestamp; cost: number; batchIdRef?: string }>;
}

/**
 * Represents the accessories kit provided with certain products.
 * This is not a direct Firestore collection but a data structure for calculation.
 */
export interface AccessoryKit {
  dilutionBottleCost: number;
  sprayerTriggerCost: number;
  syringeCost: number;
  totalKitCost: number;
}
