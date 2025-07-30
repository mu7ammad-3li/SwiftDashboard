// src/pages/PurchasesPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  Search,
  ReceiptText,
  Filter,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { RawMaterialPurchase } from "@/data/finances";
import { formatDisplayDate, formatCurrency } from "@/lib/utils";
import PurchaseFormDialog from "@/components/finances/PurchaseFormDialog"; // Import the dialog
import {
  getRawMaterialPurchases,
  deleteRawMaterialPurchase,
} from "@/services/financeService"; // Import service functions
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<RawMaterialPurchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<
    RawMaterialPurchase[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] =
    useState<RawMaterialPurchase | null>(null);

  // For delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] =
    useState<RawMaterialPurchase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRawMaterialPurchases();
      setPurchases(data);
      setFilteredPurchases(data); // Initialize filtered list
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load purchases.";
      setError(msg);
      toast({
        title: "Error Loading Purchases",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = purchases.filter(
      (p) =>
        p.itemName.toLowerCase().includes(lowerSearchTerm) ||
        (p.supplierId &&
          p.supplierId.toLowerCase().includes(lowerSearchTerm)) ||
        p.purchaseId.toLowerCase().includes(lowerSearchTerm)
    );
    setFilteredPurchases(filtered);
  }, [searchTerm, purchases]);

  const handleOpenFormDialog = (purchase?: RawMaterialPurchase) => {
    setEditingPurchase(purchase || null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingPurchase(null);
    fetchPurchases(); // Refresh the list after add/edit
  };

  const openDeleteDialog = (purchase: RawMaterialPurchase) => {
    setPurchaseToDelete(purchase);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePurchase = async () => {
    if (!purchaseToDelete || !purchaseToDelete.id) return;
    setIsDeleting(true);
    try {
      await deleteRawMaterialPurchase(purchaseToDelete.id);
      toast({
        title: "Success",
        description: `Purchase "${purchaseToDelete.itemName}" deleted.`,
      });
      fetchPurchases(); // Refresh list
      setIsDeleteDialogOpen(false);
      setPurchaseToDelete(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not delete purchase.";
      toast({
        title: "Deletion Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-2xl font-bold flex items-center">
          <ReceiptText className="mr-2 h-6 w-6" /> Raw Material & Component
          Purchases
        </h2>
        <Button onClick={() => handleOpenFormDialog()} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Purchase
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="p-4 flex gap-4 items-center border-b">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by item name, supplier, PO ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Button variant="outline" disabled>
          {" "}
          {/* TODO: Implement filters */}
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </div>

      {error && <p className="text-destructive p-4 text-center">{error}</p>}

      <ScrollArea className="flex-grow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO ID</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : !error && filteredPurchases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-10"
                >
                  {searchTerm
                    ? "No purchases match your search."
                    : "No purchases recorded yet. Click 'Add New Purchase' to start."}
                </TableCell>
              </TableRow>
            ) : (
              filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-mono text-xs">
                    {purchase.purchaseId}
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-xs">
                    {purchase.itemName}
                  </TableCell>
                  <TableCell className="truncate max-w-xs">
                    {purchase.supplierId || "N/A"}
                  </TableCell>
                  <TableCell>
                    {formatDisplayDate(purchase.purchaseDate, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    {purchase.quantityPurchased.toLocaleString()}
                  </TableCell>
                  <TableCell>{purchase.unitOfMeasure}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(purchase.unitCostPaid)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(purchase.totalCostPaid)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit Purchase"
                      onClick={() => handleOpenFormDialog(purchase)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete Purchase"
                      className="text-destructive hover:text-destructive ml-1"
                      onClick={() => openDeleteDialog(purchase)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {isFormOpen && (
        <PurchaseFormDialog
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={handleFormSuccess}
          purchase={editingPurchase}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              purchase record for "{purchaseToDelete?.itemName}" (PO ID:{" "}
              {purchaseToDelete?.purchaseId}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePurchase}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchasesPage;
