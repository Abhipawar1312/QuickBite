import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { MapPin, Plus, Trash2, Home, Briefcase, Navigation, Check, Edit2, Loader2 } from "lucide-react";
import { useUserStore, SavedAddress } from "@/store/useUserStore";

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress?: (addr: SavedAddress) => void;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  isOpen,
  onClose,
  onSelectAddress,
}) => {
  const { user, addSavedAddress, updateSavedAddress, deleteSavedAddress, loading } = useUserStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [tag, setTag] = useState<"Home" | "Work" | "Other">("Home");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTag("Home");
    setAddress("");
    setCity("");
    setPincode("");
    setDeliveryInstructions("");
    setIsDefault(false);
  };

  const handleStartEdit = (addr: SavedAddress) => {
    setEditingId(addr._id || null);
    setTag(addr.tag || "Home");
    setAddress(addr.address);
    setCity(addr.city);
    setPincode(addr.pincode || "");
    setDeliveryInstructions(addr.deliveryInstructions || "");
    setIsDefault(Boolean(addr.isDefault));
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !city.trim()) return;

    const payload: Partial<SavedAddress> = {
      label: tag,
      tag,
      address,
      city,
      pincode,
      deliveryInstructions,
      isDefault,
    };

    if (editingId) {
      await updateSavedAddress(editingId, payload);
    } else {
      await addSavedAddress(payload);
    }
    resetForm();
  };

  const savedAddresses = user?.savedAddresses || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Saved Delivery Addresses
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Manage your Home, Work, and tagged addresses for 1-click checkout
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!isAdding ? (
          <div className="space-y-4 my-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {savedAddresses.length} Saved {savedAddresses.length === 1 ? "Address" : "Addresses"}
              </span>
              <Button
                size="sm"
                onClick={() => setIsAdding(true)}
                className="h-8 px-3 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Address
              </Button>
            </div>

            {savedAddresses.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Navigation className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No saved addresses yet</p>
                <p className="text-xs text-slate-500 mt-1">Add your home or work address for quick ordering.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => onSelectAddress && onSelectAddress(addr)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start ${
                      addr.isDefault
                        ? "bg-orange-50/70 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-orange-600 font-bold shrink-0 mt-0.5">
                        {addr.tag === "Work" ? (
                          <Briefcase className="w-4 h-4" />
                        ) : addr.tag === "Home" ? (
                          <Home className="w-4 h-4" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {addr.tag || addr.label || "Address"}
                          </span>
                          {addr.isDefault && (
                            <Badge className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                          {addr.address}, {addr.city} {addr.pincode ? `- ${addr.pincode}` : ""}
                        </p>
                        {addr.deliveryInstructions && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-semibold">
                            📝 {addr.deliveryInstructions}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(addr);
                        }}
                        className="h-7 w-7 text-slate-500 hover:text-orange-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (addr._id) deleteSavedAddress(addr._id);
                        }}
                        className="h-7 w-7 text-slate-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Address Tag</Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {(["Home", "Work", "Other"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      tag === t
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {t === "Home" && "🏠 Home"}
                    {t === "Work" && "💼 Work"}
                    {t === "Other" && "📍 Other"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Complete Address</Label>
              <Input
                required
                placeholder="e.g. Flat 402, Sunshine Heights, Main Road"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl border-2 focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">City</Label>
                <Input
                  required
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl border-2 focus:border-orange-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pincode</Label>
                <Input
                  placeholder="e.g. 400001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="rounded-xl border-2 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Delivery Instructions (Optional)</Label>
              <Input
                placeholder="e.g. Leave with guard / Ring bell twice"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                className="rounded-xl border-2 focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDefaultCheck"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="isDefaultCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Set as default delivery address
              </label>
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1 rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingId ? "Update Address" : "Save Address"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
