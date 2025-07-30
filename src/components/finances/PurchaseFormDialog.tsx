// src/components/finances/PurchaseFormDialog.tsx
import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CalendarIcon } from "lucide-react";
import { RawMaterialPurchase } from "@/data/finances";
import {
  addRawMaterialPurchase,
  updateRawMaterialPurchase,
} from "@/services/financeService";
import { Timestamp } from "firebase/firestore"; // For converting Date to Timestamp
import { Calendar } from "@/components/ui/calendar"; // Shadcn Calendar
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDisplayDate } from "@/lib/utils"; // For displaying date in button

interface PurchaseFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // Callback after successful add/update
  purchase?: RawMaterialPurchase | null; // Purchase data for editing
}

// Define initial form state structure based on RawMaterialPurchase, handling date separately
interface PurchaseFormData {
  purchaseId: string;
  itemName: string;
  supplierId?: string;
  purchaseDate: Date | null; // Use JS Date for form state
  quantityPurchased: string; // Use string for input, convert to number on submit
  unitOfMeasure: string;
  unitCostPaid: string; // Use string for input
  totalCostPaid: string; // Use string for input, can be auto-calculated
  inboundShippingCostForItem?: string; // Use string for input
  notes?: string;
  invoiceUrl?: string;
}

const defaultFormData: PurchaseFormData = {
  purchaseId: "",
  itemName: "",
  supplierId: "",
  purchaseDate: new Date(), // Default to today
  quantityPurchased: "",
  unitOfMeasure: "Piece", // Default unit
  unitCostPaid: "",
  totalCostPaid: "",
  inboundShippingCostForItem: "",
  notes: "",
  invoiceUrl: "",
};

const PurchaseFormDialog: React.FC<PurchaseFormDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  purchase,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PurchaseFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Populate form if editing an existing purchase
  useEffect(() => {
    if (isOpen) {
      if (purchase) {
        setFormData({
          purchaseId: purchase.purchaseId || "",
          itemName: purchase.itemName || "",
          supplierId: purchase.supplierId || "",
          purchaseDate:
            purchase.purchaseDate instanceof Date
              ? purchase.purchaseDate
              : (purchase.purchaseDate as any)?.toDate?.() || new Date(),
          quantityPurchased: purchase.quantityPurchased?.toString() || "",
          unitOfMeasure: purchase.unitOfMeasure || "Piece",
          unitCostPaid: purchase.unitCostPaid?.toString() || "",
          totalCostPaid: purchase.totalCostPaid?.toString() || "",
          inboundShippingCostForItem:
            purchase.inboundShippingCostForItem?.toString() || "",
          notes: purchase.notes || "",
          invoiceUrl: purchase.invoiceUrl || "",
        });
      } else {
        // Reset form for new purchase, generate a default PO ID
        const defaultPO = `PO-${new Date().getFullYear()}${String(
          new Date().getMonth() + 1
        ).padStart(2, "0")}-`;
        setFormData({
          ...defaultFormData,
          purchaseId: defaultPO,
          purchaseDate: new Date(),
        });
      }
    }
  }, [purchase, isOpen]);

  // Handle input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-calculate totalCostPaid if quantity and unitCost are present
    if (name === "quantityPurchased" || name === "unitCostPaid") {
      const qty =
        name === "quantityPurchased"
          ? parseFloat(value)
          : parseFloat(formData.quantityPurchased);
      const unitCost =
        name === "unitCostPaid"
          ? parseFloat(value)
          : parseFloat(formData.unitCostPaid);
      if (!isNaN(qty) && !isNaN(unitCost)) {
        setFormData((prev) => ({
          ...prev,
          totalCostPaid: (qty * unitCost).toFixed(2),
        }));
      } else if (
        (name === "quantityPurchased" && value === "") ||
        (name === "unitCostPaid" && value === "")
      ) {
        setFormData((prev) => ({ ...prev, totalCostPaid: "" }));
      }
    }
  };

  // Handle date selection from calendar
  const handleDateSelect = (selectedDate?: Date) => {
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, purchaseDate: selectedDate }));
    }
    setIsCalendarOpen(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (
      !formData.purchaseId.trim() ||
      !formData.itemName.trim() ||
      !formData.purchaseDate ||
      !formData.quantityPurchased.trim() ||
      !formData.unitCostPaid.trim() ||
      !formData.totalCostPaid.trim() ||
      !formData.unitOfMeasure.trim()
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields: PO ID, Item Name, Purchase Date, Quantity, Unit of Measure, Unit Cost, and Total Cost.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const quantity = parseFloat(formData.quantityPurchased);
    const unitCost = parseFloat(formData.unitCostPaid);
    const totalCost = parseFloat(formData.totalCostPaid);
    const shippingCost = formData.inboundShippingCostForItem
      ? parseFloat(formData.inboundShippingCostForItem)
      : undefined;

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be a positive number.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    if (isNaN(unitCost) || unitCost < 0) {
      toast({
        title: "Validation Error",
        description: "Unit Cost must be a non-negative number.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    if (isNaN(totalCost) || totalCost < 0) {
      toast({
        title: "Validation Error",
        description: "Total Cost must be a non-negative number.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    if (
      shippingCost !== undefined &&
      (isNaN(shippingCost) || shippingCost < 0)
    ) {
      toast({
        title: "Validation Error",
        description: "Shipping Cost must be a non-negative number if provided.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const payload: Omit<RawMaterialPurchase, "id" | "purchaseDate"> & {
      purchaseDate: Date;
    } = {
      purchaseId: formData.purchaseId.trim(),
      itemName: formData.itemName.trim(),
      supplierId: formData.supplierId?.trim() || undefined,
      purchaseDate: formData.purchaseDate, // JS Date object
      quantityPurchased: quantity,
      unitOfMeasure: formData.unitOfMeasure.trim(),
      unitCostPaid: unitCost,
      totalCostPaid: totalCost,
      inboundShippingCostForItem: shippingCost,
      notes: formData.notes?.trim() || undefined,
      invoiceUrl: formData.invoiceUrl?.trim() || undefined,
    };

    try {
      if (purchase && purchase.id) {
        // Editing existing purchase
        await updateRawMaterialPurchase(purchase.id, payload);
        toast({
          title: "Success",
          description: "Purchase record updated successfully.",
        });
      } else {
        // Creating new purchase
        await addRawMaterialPurchase(payload);
        toast({
          title: "Success",
          description: "New purchase record added successfully.",
        });
      }
      onSuccess(); // Call success callback (e.g., to refresh list and close dialog)
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred.";
      toast({
        title: "Operation Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {purchase ? "Edit Purchase Record" : "Add New Purchase Record"}
          </DialogTitle>
          <DialogDescription>
            {purchase
              ? "Update the details of this purchase."
              : "Fill in the details for the new raw material or component purchase."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow min-h-0 pr-6 -mr-6">
          {" "}
          {/* Scrollable area for the form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 py-4"
            id="purchaseForm"
          >
            <div>
              <Label htmlFor="purchaseId">Purchase Order ID*</Label>
              <Input
                id="purchaseId"
                name="purchaseId"
                value={formData.purchaseId}
                onChange={handleChange}
                placeholder="e.g., PO-2025-001"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="itemName">Item Name*</Label>
              <Input
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                placeholder="e.g., Pesticide Chemical A, 50ml Bottles"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="supplierId">Supplier ID / Name (Optional)</Label>
              <Input
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                placeholder="e.g., SUPPLIER_XYZ"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="purchaseDate">Purchase Date*</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal ${
                      !formData.purchaseDate && "text-muted-foreground"
                    }`}
                    onClick={() => setIsCalendarOpen(true)}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.purchaseDate ? (
                      formatDisplayDate(formData.purchaseDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.purchaseDate || undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                    disabled={isSubmitting}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantityPurchased">Quantity Purchased*</Label>
                <Input
                  id="quantityPurchased"
                  name="quantityPurchased"
                  type="number"
                  value={formData.quantityPurchased}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                  disabled={isSubmitting}
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="unitOfMeasure">Unit of Measure*</Label>
                <Input
                  id="unitOfMeasure"
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  placeholder="e.g., Liter, Kg, Piece"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitCostPaid">Unit Cost (EGP)*</Label>
                <Input
                  id="unitCostPaid"
                  name="unitCostPaid"
                  type="number"
                  value={formData.unitCostPaid}
                  onChange={handleChange}
                  placeholder="e.g., 1500.00"
                  disabled={isSubmitting}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="totalCostPaid">Total Cost (EGP)*</Label>
                <Input
                  id="totalCostPaid"
                  name="totalCostPaid"
                  type="number"
                  value={formData.totalCostPaid}
                  onChange={handleChange}
                  placeholder="Auto-calculated or manual"
                  disabled={isSubmitting}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="inboundShippingCostForItem">
                Inbound Shipping Cost (EGP, Optional)
              </Label>
              <Input
                id="inboundShippingCostForItem"
                name="inboundShippingCostForItem"
                type="number"
                value={formData.inboundShippingCostForItem}
                onChange={handleChange}
                placeholder="e.g., 250.00"
                disabled={isSubmitting}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any relevant notes about this purchase..."
                disabled={isSubmitting}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="invoiceUrl">Invoice URL (Optional)</Label>
              <Input
                id="invoiceUrl"
                name="invoiceUrl"
                type="url"
                value={formData.invoiceUrl}
                onChange={handleChange}
                placeholder="https://example.com/invoice.pdf"
                disabled={isSubmitting}
              />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form="purchaseForm" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? "Saving..."
              : purchase
              ? "Save Changes"
              : "Add Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseFormDialog;
