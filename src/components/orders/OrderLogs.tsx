// src/components/orders/OrderLogs.tsx
import React, { useState } from "react";
import { InternalNote, Order } from "@/data/order"; // Assuming these types are correctly defined
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { Timestamp } from "firebase/firestore"; // For creating new timestamps
import { addInternalNoteToOrder } from "@/services/orderService"; // Service to add notes
import { formatDisplayDate } from "@/lib/utils"; // Using the centralized date formatter

// Props for the OrderLogs component
interface OrderLogsProps {
  orderId: string;
  notes: InternalNote[] | undefined; // Notes array
  onNoteAdded: () => void; // Callback to refresh notes in parent component
  currentUserId: string; // Identifier for the user adding the note
}

const OrderLogs: React.FC<OrderLogsProps> = ({
  orderId,
  notes = [], // Default to empty array if undefined
  onNoteAdded,
  currentUserId,
}) => {
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteSummary, setNewNoteSummary] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const { toast } = useToast();

  // Handler for adding a new internal note
  const handleAddNote = async () => {
    // Validate title and summary
    if (!newNoteTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Note title cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (!newNoteSummary.trim()) {
      toast({
        title: "Validation Error",
        description: "Note summary cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingNote(true);
    try {
      // The addInternalNoteToOrder service should handle creating the Timestamp
      const success = await addInternalNoteToOrder(
        orderId,
        newNoteTitle,
        newNoteSummary,
        currentUserId
      );

      if (success) {
        toast({
          title: "Success",
          description: "Internal note added.",
        });
        setNewNoteTitle(""); // Clear title input
        setNewNoteSummary(""); // Clear summary textarea
        onNoteAdded(); // Trigger refresh in parent
      } else {
        throw new Error("Failed to add note via service.");
      }
    } catch (error) {
      console.error("Error adding internal note:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error Adding Note",
        description: `Could not add internal note: ${msg}`,
        variant: "destructive",
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <Card className="shadow-sm rounded-lg border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Internal Order Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display Existing Notes */}
        {notes.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {notes
              // Sort notes by timestamp, newest first
              .slice() // Create a shallow copy before sorting to avoid mutating the prop
              .sort((a, b) => {
                const timeA =
                  a.timestamp instanceof Timestamp
                    ? a.timestamp.toMillis()
                    : typeof a.timestamp === "object" &&
                      a.timestamp &&
                      "seconds" in a.timestamp
                    ? (a.timestamp as Timestamp).toMillis()
                    : new Date(a.timestamp as any).getTime();
                const timeB =
                  b.timestamp instanceof Timestamp
                    ? b.timestamp.toMillis()
                    : typeof b.timestamp === "object" &&
                      b.timestamp &&
                      "seconds" in b.timestamp
                    ? (b.timestamp as Timestamp).toMillis()
                    : new Date(b.timestamp as any).getTime();
                return timeB - timeA; // Descending order
              })
              .map((note, index) => (
                <AccordionItem
                  value={`item-${index}`}
                  // Ensure key is unique, especially if timestamps could be identical briefly
                  key={`note-${index}-${note.timestamp?.toString()}-${Math.random()}`}
                  className="border-b"
                >
                  <AccordionTrigger className="text-sm hover:no-underline px-1 py-3">
                    <div className="flex flex-col text-left w-full pr-2">
                      <span className="font-medium truncate">
                        {note.title || "Untitled Note"}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatDisplayDate(note.timestamp)} by{" "}
                        {note.createdBy || "Unknown"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground px-1 pb-3 pt-1 whitespace-pre-wrap">
                    {note.summary || "No summary provided."}
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            No internal notes recorded for this order yet.
          </p>
        )}

        {/* Add New Note Form */}
        <div className="pt-4 border-t space-y-3">
          <h4 className="text-sm font-medium">Add New Internal Note</h4>
          <div>
            <Label htmlFor={`new-note-title-${orderId}`} className="text-xs">
              Note Title
            </Label>
            <Input
              id={`new-note-title-${orderId}`} // Ensure unique ID if multiple OrderLogs on a page
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="e.g., Status Update, Customer Call"
              className="mt-1"
              disabled={isAddingNote}
            />
          </div>
          <div>
            <Label htmlFor={`new-note-summary-${orderId}`} className="text-xs">
              Note Summary
            </Label>
            <Textarea
              id={`new-note-summary-${orderId}`}
              value={newNoteSummary}
              onChange={(e) => setNewNoteSummary(e.target.value)}
              placeholder="Record status updates, customer interactions, or internal actions..."
              className="mt-1 min-h-[80px]"
              disabled={isAddingNote}
            />
          </div>
          <Button
            onClick={handleAddNote}
            disabled={
              isAddingNote || !newNoteTitle.trim() || !newNoteSummary.trim()
            }
            className="w-full sm:w-auto"
            size="sm"
          >
            {isAddingNote ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="mr-2 h-4 w-4" />
            )}
            {isAddingNote ? "Adding..." : "Add Note"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderLogs;
