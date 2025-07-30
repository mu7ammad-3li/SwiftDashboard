import React, { useState } from "react";
import { InternalNote } from "../data/order"; // Import the updated note type
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // Import Input for Title
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { addInternalNoteToOrder } from "../services/orderService"; // Service to add notes
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { Timestamp } from "firebase/firestore"; // Import Timestamp

// --- Props Definition ---
interface OrderLogsProps {
  orderId: string;
  notes: InternalNote[] | undefined; // Notes array using the updated interface
  onNoteAdded: () => void; // Callback to refresh notes in parent
  currentUserId: string; // Accept the current user's identifier
}

// --- Helper to format Timestamp or Date ---
const formatLogTimestamp = (
  timestamp: Date | Timestamp | undefined
): string => {
  if (!timestamp) return "No date";
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return "Invalid Date";
  }
  // Format example: May 2, 2025, 3:50 PM
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// --- Component ---
const OrderLogs: React.FC<OrderLogsProps> = ({
  orderId,
  notes = [], // Default to empty array if undefined
  onNoteAdded,
  currentUserId, // Destructure the prop
}) => {
  const [newNoteTitle, setNewNoteTitle] = useState(""); // State for the title
  const [newNoteSummary, setNewNoteSummary] = useState(""); // State for the summary
  const [isAddingNote, setIsAddingNote] = useState(false);
  const { toast } = useToast();

  // --- Handle adding a new note ---
  const handleAddNote = async () => {
    // Validate both title and summary
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
      // --- Use the passed currentUserId prop ---
      const success = await addInternalNoteToOrder(
        orderId,
        newNoteTitle,
        newNoteSummary,
        currentUserId // Use the prop value here
      );

      if (success) {
        toast({
          title: "Success",
          description: "Internal note added.",
        });
        setNewNoteTitle(""); // Clear the title input
        setNewNoteSummary(""); // Clear the summary textarea
        onNoteAdded(); // Trigger refresh in parent component
      } else {
        // This else block might not be reached if addInternalNoteToOrder throws on failure
        throw new Error("Failed to add note via service (returned false).");
      }
    } catch (error) {
      console.error("Error adding internal note:", error);
      // The error thrown from addInternalNoteToOrder will be caught here
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error Adding Note",
        // Display the specific error message from the service
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
        <CardTitle className="text-lg">Internal Order Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* --- Display Existing Notes --- */}
        {notes.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {notes
              // Sort notes by timestamp, newest first
              .sort((a, b) => {
                const timeA =
                  a.timestamp instanceof Timestamp
                    ? a.timestamp.toMillis()
                    : a.timestamp instanceof Date
                    ? a.timestamp.getTime()
                    : 0;
                const timeB =
                  b.timestamp instanceof Timestamp
                    ? b.timestamp.toMillis()
                    : b.timestamp instanceof Date
                    ? b.timestamp.getTime()
                    : 0;
                return timeB - timeA; // Descending order
              })
              .map((note, index) => (
                <AccordionItem
                  value={`item-${index}`}
                  key={`note-${index}-${note.timestamp?.toString()}`}
                  className="border-b"
                >
                  <AccordionTrigger className="text-sm hover:no-underline px-1 py-3">
                    <div className="flex flex-col text-left w-full pr-2">
                      {/* Display Title */}
                      <span className="font-medium truncate">
                        {note.title || "Untitled Note"} {/* Fallback title */}
                      </span>
                      {/* Timestamp and Created By */}
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatLogTimestamp(note.timestamp)} by{" "}
                        {note.createdBy || "Unknown"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground px-1 pb-3 pt-1 whitespace-pre-wrap">
                    {/* Display Summary here */}
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

        {/* --- Add New Note Form --- */}
        <div className="pt-4 border-t space-y-3">
          <h4 className="text-sm font-medium">Add New Internal Note</h4>
          {/* Title Input */}
          <div>
            <Label htmlFor="new-note-title" className="text-xs">
              Note Title
            </Label>
            <Input
              id="new-note-title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="e.g., Status Update, Customer Call"
              className="mt-1"
              disabled={isAddingNote}
            />
          </div>
          {/* Summary Textarea */}
          <div>
            <Label htmlFor="new-note-summary" className="text-xs">
              Note Summary
            </Label>
            <Textarea
              id="new-note-summary"
              value={newNoteSummary}
              onChange={(e) => setNewNoteSummary(e.target.value)}
              placeholder="Record status updates, customer interactions, or internal actions..."
              className="mt-1 min-h-[80px]"
              disabled={isAddingNote}
            />
          </div>
          {/* Add Button */}
          <Button
            onClick={handleAddNote}
            disabled={
              isAddingNote || !newNoteTitle.trim() || !newNoteSummary.trim()
            } // Disable if title or summary is empty
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
