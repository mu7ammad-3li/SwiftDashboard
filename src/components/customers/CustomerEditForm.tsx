// src/components/customers/CustomerEditForm.tsx
import React, { ChangeEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Customer } from "@/data/customer"; // Customer data type
import governoratesData from "@/data/governorates"; // For governorate/city dropdowns

// Props for the CustomerEditForm component
export interface CustomerEditFormData
  extends Partial<Omit<Customer, "id" | "address">> {
  // Ensure address is always an object, even if its fields are partial
  address?: Partial<Customer["address"]>;
}

interface CustomerEditFormProps {
  formData: CustomerEditFormData; // The current data for the form fields
  onFormChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void; // Handles direct input changes
  onSelectChange: (
    name: "governorate" | "city" | "status",
    value: string
  ) => void; // Handles select dropdown changes
  // onSubmit: (e: React.FormEvent) => void; // Submit is usually handled by parent's DialogFooter button
  isSaving: boolean; // To disable inputs during save operation
  governorateNames: string[]; // List of governorate names
  citiesForForm: string[]; // Dynamically updated list of cities based on selected governorate
}

const CustomerEditForm: React.FC<CustomerEditFormProps> = ({
  formData,
  onFormChange,
  onSelectChange,
  isSaving,
  governorateNames,
  citiesForForm,
}) => {
  // Ensure formData and formData.address are not undefined for safe access
  const currentFullName = formData.fullName || "";
  const currentEmail = formData.email || "";
  const currentPhone = formData.phone || ""; // Usually read-only ID
  const currentSecondPhone = formData.secondPhone || "";
  const currentStatus = formData.status || "active";

  const currentAddress = formData.address || {};
  const currentGovernorate = currentAddress.governorate || "";
  const currentCity = currentAddress.city || "";
  const currentFullAddress = currentAddress.fullAdress || "";
  const currentLandmark = currentAddress.landMark || "";

  return (
    // The <form> tag might be in the parent Dialog if DialogFooter buttons are used for submission
    // For now, we'll assume this component renders the fields within a structure provided by the parent.
    <div className="grid gap-4 py-4">
      {/* Full Name */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-fullName" className="text-right col-span-1">
          Full Name*
        </Label>
        <Input
          id="edit-fullName"
          name="fullName"
          value={currentFullName}
          onChange={onFormChange}
          className="col-span-3"
          required
          disabled={isSaving}
        />
      </div>

      {/* Phone (Readonly ID) */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-phone" className="text-right col-span-1">
          Phone (ID)
        </Label>
        <Input
          id="edit-phone"
          name="phone" // Name is important for onFormChange if it were editable
          value={currentPhone}
          className="col-span-3 bg-muted/70 cursor-not-allowed"
          readOnly
          disabled // Always disabled as it's an ID
        />
      </div>

      {/* Governorate */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label
          htmlFor="edit-address-governorate"
          className="text-right col-span-1"
        >
          Governorate*
        </Label>
        <Select
          name="governorate" // For onSelectChange
          value={currentGovernorate}
          onValueChange={(value) => onSelectChange("governorate", value)}
          required
          disabled={isSaving}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select governorate" />
          </SelectTrigger>
          <SelectContent>
            {governorateNames.map((gov) => (
              <SelectItem key={gov} value={gov}>
                {gov}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-address-city" className="text-right col-span-1">
          City*
        </Label>
        <Select
          name="city" // For onSelectChange
          value={currentCity}
          onValueChange={(value) => onSelectChange("city", value)}
          required
          disabled={isSaving || !currentGovernorate} // Disable if no governorate
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {citiesForForm.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Full Address */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label
          htmlFor="edit-address.fullAdress"
          className="text-right col-span-1"
        >
          Full Address*
        </Label>
        <Textarea
          id="edit-address.fullAdress"
          name="address.fullAdress" // Used by onFormChange to target nested state
          value={currentFullAddress}
          onChange={onFormChange}
          className="col-span-3"
          required
          disabled={isSaving}
          rows={3}
        />
      </div>

      {/* Landmark */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label
          htmlFor="edit-address.landMark"
          className="text-right col-span-1"
        >
          Landmark
        </Label>
        <Input
          id="edit-address.landMark"
          name="address.landMark" // Used by onFormChange
          value={currentLandmark}
          onChange={onFormChange}
          className="col-span-3"
          disabled={isSaving}
        />
      </div>

      {/* Email */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-email" className="text-right col-span-1">
          Email
        </Label>
        <Input
          id="edit-email"
          name="email"
          type="email"
          value={currentEmail}
          onChange={onFormChange}
          className="col-span-3"
          disabled={isSaving}
        />
      </div>

      {/* Second Phone */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-secondPhone" className="text-right col-span-1">
          Second Phone
        </Label>
        <Input
          id="edit-secondPhone"
          name="secondPhone"
          value={currentSecondPhone}
          onChange={onFormChange}
          className="col-span-3"
          maxLength={11} // Assuming Egyptian phone numbers
          disabled={isSaving}
        />
      </div>

      {/* Status */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="edit-status" className="text-right col-span-1">
          Status
        </Label>
        <Select
          name="status" // For onSelectChange
          value={currentStatus}
          onValueChange={(value) =>
            onSelectChange("status", value as Customer["status"])
          }
          required
          disabled={isSaving}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            {/* 'deleted' status is typically handled by a delete action, not direct selection in an edit form */}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CustomerEditForm;
