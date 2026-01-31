"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Edit2, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NOTE_COLORS, type NoteColor } from "@/types";
import { toast } from "sonner";

interface Label {
  id: string;
  name: string;
  color: NoteColor;
  emoji: string;
  description?: string;
  noteCount?: number;
}

interface LabelManagerProps {
  onLabelsChange?: () => void;
}

const EMOJI_OPTIONS = ["🏷️", "💼", "🏠", "💡", "📚", "🎯", "⭐", "❤️", "🎨", "🎵", "📝", "🔥"];
const COLORS: NoteColor[] = ["white", "yellow", "orange", "red", "green", "teal", "blue", "purple", "pink", "gray"];

export function LabelManager({ onLabelsChange }: LabelManagerProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<NoteColor>("white");
  const [selectedEmoji, setSelectedEmoji] = useState("🏷️");
  const [description, setDescription] = useState("");

  const fetchLabels = useCallback(async () => {
    try {
      const response = await fetch("/api/labels");
      const data = await response.json();
      setLabels(data);
    } catch (error) {
      console.error("Failed to fetch labels:", error);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const resetForm = () => {
    setName("");
    setSelectedColor("white");
    setSelectedEmoji("🏷️");
    setDescription("");
    setEditingLabel(null);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          color: selectedColor,
          emoji: selectedEmoji,
          description: description || null,
        }),
      });

      if (response.ok) {
        toast.success("Label created");
        resetForm();
        setIsCreating(false);
        fetchLabels();
        onLabelsChange?.();
      }
    } catch (error) {
      toast.error("Failed to create label");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingLabel || !name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/labels?id=${editingLabel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          color: selectedColor,
          emoji: selectedEmoji,
          description: description || null,
        }),
      });

      if (response.ok) {
        toast.success("Label updated");
        resetForm();
        fetchLabels();
        onLabelsChange?.();
      }
    } catch (error) {
      toast.error("Failed to update label");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (labelId: string) => {
    if (!confirm("Delete this label? It will be removed from all notes.")) return;

    try {
      const response = await fetch(`/api/labels?id=${labelId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Label deleted");
        fetchLabels();
        onLabelsChange?.();
      }
    } catch (error) {
      toast.error("Failed to delete label");
    }
  };

  const startEdit = (label: Label) => {
    setEditingLabel(label);
    setName(label.name);
    setSelectedColor(label.color);
    setSelectedEmoji(label.emoji);
    setDescription(label.description || "");
    setIsCreating(true);
  };

  return (
    <div className="space-y-4">
      {/* Label List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-lg">{label.emoji}</span>
              <div className={`w-3 h-3 rounded-full ${NOTE_COLORS[label.color].bg}`} />
              <span className="font-medium truncate">{label.name}</span>
              {label.noteCount !== undefined && (
                <span className="text-xs text-gray-400">({label.noteCount})</span>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(label)}>
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500"
                onClick={() => handleDelete(label.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreating}
        onOpenChange={(open) => {
          setIsCreating(open);
          if (!open) resetForm();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Label
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLabel ? "Edit Label" : "Create Label"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Label name"
              />
            </div>

            {/* Emoji */}
            <div>
              <label className="text-sm font-medium">Icon</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-8 h-8 rounded-lg text-lg transition-all ${
                      selectedEmoji === emoji ? "bg-amber-100 ring-2 ring-amber-500" : "hover:bg-gray-100"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${NOTE_COLORS[color].bg} ${
                      selectedColor === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={editingLabel ? handleUpdate : handleCreate}
                disabled={!name.trim() || isLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-600"
              >
                {editingLabel ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
