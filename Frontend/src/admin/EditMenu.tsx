"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type MenuFormSchema, menuSchema } from "@/schema/menuSchema";
import { useMenuStore } from "@/store/useMenuStore";
import type { MenuItem } from "@/types/restaurantType";
import {
  Loader2,
  Edit3,
  ImageIcon,
  IndianRupee,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { motion } from "framer-motion";

// Extended form schema to include availability
interface ExtendedMenuFormSchema extends MenuFormSchema {
  availability: "Available" | "Out of Stock";
}

const EditMenu = ({
  selectedMenu,
  editOpen,
  setEditOpen,
}: {
  selectedMenu: MenuItem;
  editOpen: boolean;
  setEditOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [input, setInput] = useState<ExtendedMenuFormSchema>({
    name: "",
    description: "",
    price: 0,
    image: undefined,
    availability: "Available",
    isVeg: true,
    category: "Main Course",
    addOns: [],
  });
  const [addOnName, setAddOnName] = useState("");
  const [addOnPrice, setAddOnPrice] = useState("");
  const [error, setError] = useState<Partial<MenuFormSchema>>({});
  const { loading, editMenu } = useMenuStore();

  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setInput({ ...input, [name]: type === "number" ? Number(value) : value });
  };

  const handleAvailabilityChange = (checked: boolean) => {
    setInput({
      ...input,
      availability: checked ? "Available" : "Out of Stock",
    });
  };

  const handleAddAddOn = () => {
    if (!addOnName.trim() || !addOnPrice.trim()) return;
    const priceNum = Number(addOnPrice);
    if (isNaN(priceNum) || priceNum < 0) return;
    const updated = [...(input.addOns || []), { name: addOnName.trim(), price: priceNum }];
    setInput({ ...input, addOns: updated });
    setAddOnName("");
    setAddOnPrice("");
  };

  const handleRemoveAddOn = (index: number) => {
    const updated = (input.addOns || []).filter((_, i) => i !== index);
    setInput({ ...input, addOns: updated });
  };

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError({});
    const basicInput = {
      name: input.name,
      description: input.description,
      price: input.price,
      image: input.image,
    };
    const result = menuSchema.safeParse(basicInput);
    if (!result.success) {
      const fieldErrors = result.error.formErrors.fieldErrors;
      setError(fieldErrors as Partial<MenuFormSchema>);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", input.name);
      formData.append("description", input.description);
      formData.append("price", input.price.toString());
      formData.append("availability", input.availability);
      formData.append("isVeg", (input.isVeg !== false).toString());
      formData.append("category", input.category || "Main Course");
      formData.append("addOns", JSON.stringify(input.addOns || []));
      if (input.image) {
        formData.append("image", input.image);
      }
      await editMenu(selectedMenu._id, formData);
      setEditOpen(false);
      setError({});
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedMenu) {
      setInput({
        name: selectedMenu?.name || "",
        description: selectedMenu?.description || "",
        price: selectedMenu?.price || 0,
        image: undefined,
        availability: selectedMenu?.availability || "Available",
        isVeg: selectedMenu?.isVeg !== false,
        category: selectedMenu?.category || "Main Course",
        addOns: selectedMenu?.addOns || [],
      });
      setError({});
    }
  }, [selectedMenu, editOpen]);

  return (
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="max-w-md mx-auto bg-white dark:bg-slate-800 border-0 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Edit3 className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Edit Menu
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Update your menu to keep your offerings fresh and exciting!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitHandler} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Name
              </Label>
              <Input
                type="text"
                name="name"
                value={input.name}
                onChange={changeEventHandler}
                placeholder="Enter menu name"
                className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-all duration-300"
              />
              {error.name && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-red-600"
                >
                  {error.name}
                </motion.span>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Description
              </Label>
              <Input
                type="text"
                name="description"
                value={input.description}
                onChange={changeEventHandler}
                placeholder="Enter menu description"
                className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-all duration-300"
              />
              {error.description && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-red-600"
                >
                  {error.description}
                </motion.span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Price (₹)
                </Label>
                <Input
                  type="number"
                  name="price"
                  value={input.price}
                  onChange={changeEventHandler}
                  placeholder="Enter menu price"
                  className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-all duration-300"
                />

                {error.price && (
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium text-red-600"
                  >
                    {error.price}
                  </motion.span>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Category
                </Label>
                <Input
                  type="text"
                  name="category"
                  value={input.category || ""}
                  onChange={changeEventHandler}
                  placeholder="e.g. Starters, Main Course"
                  className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Dietary Type (Veg / Non-Veg) */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${input.isVeg !== false ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {input.isVeg !== false ? "Pure Veg 🟢" : "Non-Veg 🔴"}
                </span>
              </div>
              <Switch
                checked={input.isVeg !== false}
                onCheckedChange={(val) => setInput({ ...input, isVeg: val })}
                className="data-[state=checked]:bg-green-500"
              />
            </div>

            {/* Custom Modifiers / Add-ons Builder */}
            <div className="space-y-2.5 p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Customizable Add-ons & Modifiers (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add-on Name (e.g. Extra Cheese)"
                  value={addOnName}
                  onChange={(e) => setAddOnName(e.target.value)}
                  className="text-xs h-9 rounded-lg"
                />
                <Input
                  type="number"
                  placeholder="Price (₹)"
                  value={addOnPrice}
                  onChange={(e) => setAddOnPrice(e.target.value)}
                  className="text-xs h-9 w-24 rounded-lg"
                />
                <Button
                  type="button"
                  onClick={handleAddAddOn}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold h-9 text-xs px-3 rounded-lg"
                >
                  Add
                </Button>
              </div>

              {input.addOns && input.addOns.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {input.addOns.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-medium text-slate-800 dark:text-slate-200"
                    >
                      {a.name} (+₹{a.price})
                      <button
                        type="button"
                        onClick={() => handleRemoveAddOn(i)}
                        className="text-red-500 hover:text-red-700 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Availability Toggle */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Availability Status
              </Label>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-3">
                  {input.availability === "Available" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {input.availability === "Available"
                        ? "Available"
                        : "Out of Stock"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {input.availability === "Available"
                        ? "Customers can order this item"
                        : "This item is currently unavailable"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={input.availability === "Available"}
                  onCheckedChange={handleAvailabilityChange}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Upload Menu Image
              </Label>
              <Input
                type="file"
                name="image"
                accept="image/*"
                onChange={(e) =>
                  setInput({
                    ...input,
                    image: e.target.files?.[0] || undefined,
                  })
                }
                className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {error.image && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-red-600"
                >
                  {error.image?.name}
                </motion.span>
              )}
            </div>
            <DialogFooter className="pt-6">
              {loading ? (
                <Button
                  disabled
                  type="button"
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold"
                >
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Please wait
                </Button>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Update Menu
                  </Button>
                </motion.div>
              )}
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMenu;
